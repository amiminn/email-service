import { Hono } from "hono";
import { sendMailSMTP } from "./mailservice";
import { z } from "zod";
import { ACCESS_KEY, MAXEMAILS } from "./config";
import { cors } from "hono/cors";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: ["https://amiminn.my.id", "http://localhost:59354"],
    allowHeaders: ["Content-Type", "access-key"],
  })
);

app.get("/", (c: any) => {
  return c.json({
    author: "amiminn",
    official: "https://amiminn.my.id",
    github: "https://github.com/amiminn",
  });
});

app.use("*", async (c, next) => {
  const accessKey = c.req.header("access-key");

  if (!accessKey || accessKey !== ACCESS_KEY) {
    return c.json(
      { success: false, message: "Unauthorized: Invalid access key" },
      401
    );
  }

  await next();
});

app.post("/api/send-mail", async (c) => {
  const { name, to, subject, content } = await c.req.json();

  const validation = emailSchema.safeParse({ name, subject, content });
  if (!validation.success) {
    const errors = validation.error.errors.map((err) => ({
      field: err.path[0],
      message: err.message,
    }));
    return c.json({ success: false, errors }, 400);
  }

  try {
    if (typeof to === "string") {
      sendMailSMTP({ name, to, subject, content });
      return c.json({ success: true, message: "Email sent successfully" });
    } else if (Array.isArray(to)) {
      if (to.length > MAXEMAILS) {
        return c.json(
          {
            success: false,
            message:
              "You can only send to a maximum of " + MAXEMAILS + " recipients",
          },
          400
        );
      }

      to.map((email: string) => {
        sendMailSMTP({ name, to: email, subject, content });
        return email;
      });

      return c.json({ success: true, message: "Emails sent successfully" });
    } else {
      return c.json({ success: false, message: "Invalid 'to' field" }, 400);
    }
  } catch (error) {
    return c.json({ success: false, error: "Failed to send email" }, 500);
  }
});

app.all("*", (c) => {
  return c.json({ success: false, message: "404 not found" }, 404);
});

export default {
  port: 3000,
  fetch: app.fetch,
};

const emailSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  subject: z.string().min(1, { message: "Subject is required." }),
  content: z.string().min(1, { message: "Content cannot be empty." }),
});
