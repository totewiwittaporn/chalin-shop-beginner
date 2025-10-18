export function openPopupWithMessage(messageHtml = "Loading...") {
  const popup = window.open("", "_blank", "noopener,noreferrer");
  if (!popup) return null;
  popup.document.open();
  popup.document.write(
    `<!doctype html><html><head><meta charset="utf-8"/></head>
     <body style="font-family: ui-sans-serif, system-ui; padding:16px">
       ${messageHtml}
     </body></html>`
  );
  popup.document.close();
  return popup;
}

function collectHeadStyles() {
  return Array.from(
    document.querySelectorAll('head link[rel="stylesheet"], head style')
  ).map(el => el.outerHTML).join("\n");
}

export function showHtmlInPopup(popup, htmlString) {
  const headStyles = collectHeadStyles();
  popup.document.open();
  popup.document.write(`<!doctype html>
<html><head><meta charset="utf-8"/>${headStyles}</head>
<body>${htmlString}</body></html>`);
  popup.document.close();
}

export function showPdfInPopup(popup, pdfUrl) {
  popup.document.open();
  popup.document.write(`
    <!doctype html>
    <html><head><meta charset="utf-8"/></head>
    <body style="margin:0">
      <iframe src="${pdfUrl}" style="border:0;width:100vw;height:100vh"></iframe>
    </body></html>
  `);
  popup.document.close();
}

export function printAndClose(popup, delayMs = 300) {
  setTimeout(() => {
    try { popup.focus(); popup.print(); } finally { popup.close(); }
  }, delayMs);
}
