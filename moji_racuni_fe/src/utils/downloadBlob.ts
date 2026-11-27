// Some browsers start a blob download asynchronously after the click, so the
// object URL is revoked only after a generous delay.
const REVOKE_DELAY_MS = 40_000;

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  // Firefox only follows clicks on links that are part of the document.
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
};
