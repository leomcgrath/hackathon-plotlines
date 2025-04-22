import express, {type Request, type Response } from "express";

const tipsRoute = express.Router();

const tips: string[] = [
  "Når man legger til en ny route, så må man huske å legge de til i listen i routes.ts-filen.",
  "Sanne er personen man bør gå til om man har veldig veldig vanskelige spørsmål.",
  "Det er ofte snacks ved vinduet i kantina!",
  "Vi låser Skuret på kvelden, så du kan fint legge igjen sekk og pc."
];

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
