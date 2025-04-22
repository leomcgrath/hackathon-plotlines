import express, {type Request, type Response } from "express";

const tipsRoute = express.Router();

const tips: string[] = ["Anniken", "Kristian", "Øyvind", "Magnus"];

interface ParticipantRequestBody {
  participant: string;
}

tipsRoute.post("/tips", async (req: Request, res: Response) => {
  const { participant } = req.body;

  tips.push(participant);
  return res.status(200).json({ tips });
});

tipsRoute.get("/tips", async (req: Request, res: Response) => {
  return res.status(200).json({ tips });
});

export default tipsRoute;
