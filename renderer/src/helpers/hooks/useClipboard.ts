export const useClipboard = () => {
  const copyToClipboardHandle = (e: React.MouseEvent) => {
    const cell = e.target as HTMLElement;
    const originaValue = cell.textContent || "";
    const cellColumnName = cell.getAttribute("data-column") || "";
    let modifiedValue: string | number | undefined;

    if (cellColumnName === "duration" || cellColumnName === "total") {
      if (originaValue.includes("h")) {
        modifiedValue = parseFloat(originaValue.slice(0, -1));
      } else if (originaValue.includes("m")) {
        const minutes = parseFloat(originaValue.slice(0, -1));
        modifiedValue = Math.floor((minutes / 60) * 100) / 100;
      }
    }

    navigator.clipboard
      .writeText(modifiedValue !== undefined ? String(modifiedValue) : originaValue)
      .then(() => {
        const range = document.createRange();
        range.selectNodeContents(cell);

        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);

          setTimeout(() => {
            selection.removeAllRanges();
          }, 100);
        }
      })
      .catch((error) => {
        console.error("Clipboard write error:", error);
      });
  };

  return { copyToClipboardHandle };
};
