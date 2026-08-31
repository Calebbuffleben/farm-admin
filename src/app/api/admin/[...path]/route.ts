import { proxyFarmBackend } from "@/lib/farm-backend-client";

type Params = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, { params }: Params) {
  const { path } = await params;
  return proxyFarmBackend(request, path);
}

export async function POST(request: Request, { params }: Params) {
  const { path } = await params;
  return proxyFarmBackend(request, path);
}

export async function PATCH(request: Request, { params }: Params) {
  const { path } = await params;
  return proxyFarmBackend(request, path);
}

export async function DELETE(request: Request, { params }: Params) {
  const { path } = await params;
  return proxyFarmBackend(request, path);
}
