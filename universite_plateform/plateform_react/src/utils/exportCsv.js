const escapeCell = (value) => {
  let normalized = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@]/.test(normalized)) normalized = `'${normalized}`;
  return `"${normalized.replaceAll('"', '""')}"`;
};

export const exportCsv = ({ filename, title, identity, headers, rows }) => {
  const institution = identity?.nom || 'Gestion universitaire';
  const contact = [identity?.adresse, identity?.telephone, identity?.email]
    .filter(Boolean)
    .join(' | ');
  const lines = [
    [institution],
    identity?.sigle ? [identity.sigle] : null,
    contact ? [contact] : null,
    [title],
    [`Exporté le ${new Date().toLocaleString('fr-FR')}`],
    [],
    headers,
    ...rows,
  ].filter(Boolean);

  const csv = `\uFEFF${lines.map((line) => line.map(escapeCell).join(';')).join('\r\n')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
