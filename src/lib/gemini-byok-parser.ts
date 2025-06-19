export function createGeminiBYOKStreamParser() {
  const decoder = new TextDecoder()
  let buffer = ''

  return (chunk: Uint8Array) => {
    const decodedChunk = decoder.decode(chunk, { stream: true })
    buffer += decodedChunk

    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    return lines
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.replace(/^data: /, '').trim())
      .map((line) => {
        const parsed = JSON.parse(line)
        return parsed.candidates?.[0]?.content?.parts?.[0]?.text || ''
      })
      .join('')
  }
}
