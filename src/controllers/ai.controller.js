
import { runCrmAgent } from "../services/graph.js";

export async function chat(req, res, next) {
  try {
    const message = req.body?.message;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: "A non-empty message is required." },
      });
    }

    if (message.length > 4000) {
      return res.status(400).json({
        success: false,
        error: { message: "Message must be 4000 characters or fewer." },
      });
    }

    // // This must be set by your authentication middleware.
    const userId = req.body.userId;
    console.log(req.body.userId)

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: "Authentication is required." },
      });
    }

    const answer = await runCrmAgent({
      message: message.trim(),
      userId: String(userId),
    });

    return res.status(200).json({
      success: true,
      data: {
        message: answer,
      },
    });
  } catch (error) {
    return next(error);
  }
}
