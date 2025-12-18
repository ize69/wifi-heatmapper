/*
 * wifi-heatmapper
 * File: src/lib/downloadImage.ts
 * Library helper used by server and client code.
 * Generated: 2025-12-18T10:28:20.555Z
 */

const downloadImage = (imageUrl: string, fileName: string) => {
  const link = document.createElement("a");
  link.href = imageUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default downloadImage;
