export async function sleep(durationInMs: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, durationInMs))
}

