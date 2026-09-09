import { requestHandler } from "../server/index.cjs";

export default async function handler(req, res) {
	return requestHandler(req, res);
}
