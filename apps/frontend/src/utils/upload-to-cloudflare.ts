export function uploadToCloudflare(
  uploadURL: string,
  file: File,
  onProgress: (percent: number) => void,
) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable)
        onProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener("load", () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve(true)
        : reject(new Error(`${xhr.status}`)),
    );
    xhr.addEventListener("error", reject);

    xhr.open("PUT", uploadURL);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
}
