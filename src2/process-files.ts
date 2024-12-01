import crypto from 'node:crypto';

const sha = (x: crypto.BinaryLike) =>
  crypto.createHash('sha256').update(x).digest('hex');

interface ResultError {
  file: string;
  message: string;
}

interface ResultData {
  id: string;
  file: string;
  content: string;
}

type Callback = (
  err: Error | null,
  data?: ResultData & {
    fileHash: string;
  },
) => void;

export type Processor = (file: string, cb: Callback) => void;

const CHUNK_SIZE = 10;

const ProcessFiles = (processor: Processor) => {
  const results: {
    data: ResultData[];
    errors: ResultError[];
    hash: string;
  } = {
    data: [],
    errors: [],
    hash: '',
  };

  const processChunks = (chunks: string[][], cb: () => void) => {
    const firstChunk = chunks.shift();
    if (!firstChunk) {
      cb();
      return;
    }
    let remaining = firstChunk.length;

    firstChunk.forEach((file) => {
      processor(file, (err, data) => {
        if (!data) {
          results.errors.push({
            file,
            message: err instanceof Error ? err.message : 'Unknown error',
          });
        } else {
          const { fileHash, ...rest } = data;
          results.data.push(rest);
          results.hash = sha(`${results.hash}${fileHash}`);
        }
        remaining -= 1;
        if (remaining === 0) {
          processChunks(chunks, cb);
        }
      });
    });
  };

  return (files: string[], cb: (x: typeof results) => void) => {
    const chunks = Array.from(
      { length: Math.ceil(files.length / CHUNK_SIZE) },
      (_, index) => files.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE),
    );
    processChunks(chunks, () => cb(results));
  };
};

export default ProcessFiles;
