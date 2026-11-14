import { createServer } from "node:http";
function sendJSON(res, status, data) {
  res.setHeader("Content-Type", "application/json");
  res.statusCode = status;
  res.end(JSON.stringify(data));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let buffer = [];
    req.on("data", (chunk) => {
      buffer.push(chunk);
    });
    req.on("end", () => {
      const data = Buffer.concat(buffer).toString();
      resolve(data);
    });
    req.on("error", (error) => {
      reject(error);
    });
  });
}
const users = [];
const server = createServer(async (req, res) => {
  const u = new URL(req.url, "http://localhost:3000");
  const seg = u.pathname.split("/");
  if (u.pathname == "/" && req.method == "GET") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.end("Hello");
  } else if (u.pathname == "/users" && req.method == "GET") {
    sendJSON(res, 200, users);
  } else if (u.pathname === "/users" && req.method == "POST") {
    try {
      let body = await readBody(req);
      let data = JSON.parse(body);
      if (typeof data != "object" || data === null || Array.isArray(data)) {
        return sendJSON(res, 400, { error: "Not an object" });
      }
      if (data.name === undefined) {
        return sendJSON(res, 400, { error: "No name" });
      }
      if (typeof data.name != "string") {
        return sendJSON(res, 400, { error: "Not a string" });
      }
      if (data.name.trim() === "") {
        return sendJSON(res, 400, { error: "Empty Name" });
      }
      let id = -1;
      if (users.length == 0) {
        id = 1;
      } else {
        id = users[users.length - 1].id + 1;
      }
      users.push({ name: data.name, id: id });
      sendJSON(res, 201, { id: id, name: data.name });
    } catch (error) {
      sendJSON(res, 400, { error: "Invalid JSON" });
    }
  } else if (seg.length === 3 && seg[1] === "users" && req.method == "GET") {
    const num = Number(seg[2]);
    if (Number.isNaN(num)) {
      return sendJSON(res, 400, { error: "Invalid Integer" });
    }
    for (let user of users) {
      if (num === user.id) {
        return sendJSON(res, 200, user);
      }
    }
    return sendJSON(res, 404, { error: "No such user Exists" });
  } else {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain");
    res.end("Page not found.");
  }
});
server.listen(3000, () => console.log(`Listening on port 3000`));
