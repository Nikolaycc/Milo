interface Params {
  id: string;
}

export default function GetId(req: Request, { id }: Params) {
  return new Response(`id: ${id}`);
}
