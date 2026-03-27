import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: process.env.PORT || 8080 });

const users = new Map();

wss.on("connection", (ws) => {
    let currentUser = null;

    ws.on("message", (message) => {
        const data = JSON.parse(message);

        if (data.type === "register") {
            currentUser = data.username;
            users.set(currentUser, ws);
            ws.send(JSON.stringify({ type: "registered", username: currentUser }));
        }

        if (data.type === "offer") {
            const target = users.get(data.target);
            if (target) {
                target.send(JSON.stringify({
                    type: "offer",
                    offer: data.offer,
                    from: currentUser
                }));
            }
        }

        if (data.type === "answer") {
            const target = users.get(data.target);
            if (target) {
                target.send(JSON.stringify({
                    type: "answer",
                    answer: data.answer,
                    from: currentUser
                }));
            }
        }

        if (data.type === "ice-candidate") {
            const target = users.get(data.target);
            if (target) {
                target.send(JSON.stringify({
                    type: "ice-candidate",
                    candidate: data.candidate,
                    from: currentUser
                }));
            }
        }

        if (data.type === "check-online") {
            const isOnline = users.has(data.username);
            ws.send(JSON.stringify({ type: "online-status", username: data.username, online: isOnline }));
        }
    });

    ws.on("close", () => {
        if (currentUser) {
            users.delete(currentUser);
        }
    });
});

console.log("Echo signaling server running");