const Table = ({
  columns,
  renderRow,
  data,
}: {
  columns: { header: string; accessor: string; className?: string }[];
  renderRow: (item: any) => React.ReactNode;
  data: any[];
}) => {
  return (
    <div className="mt-4 w-full overflow-x-visible md:overflow-x-auto">
      <table className="w-full table-auto md:min-w-[640px] md:table-fixed [&_td]:px-2 [&_td]:py-3 [&_th]:px-3 [&_th]:py-3 sm:[&_td]:px-4 sm:[&_th]:px-4">
        <thead className="hidden md:table-header-group">
          <tr className="text-left text-gray-500 text-sm">
            {columns.map((col) => (
              <th key={col.accessor} className={col.className}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{data.map((item) => renderRow(item))}</tbody>
      </table>
    </div>
  );
};

export default Table;
