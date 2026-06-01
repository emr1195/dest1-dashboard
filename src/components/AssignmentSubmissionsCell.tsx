type Submission = {
  id: string;
  fileName: string;
  filePath: string;
  student: {
    name: string;
    surname: string;
  };
};

const AssignmentSubmissionsCell = ({ submissions }: { submissions: Submission[] }) => {
  if (!submissions.length) {
    return <span className="text-xs text-gray-500">Sin respuestas</span>;
  }

  return (
    <div className="flex max-w-[220px] flex-col gap-1">
      {submissions.map((submission) => (
        <a
          key={submission.id}
          href={submission.filePath}
          target="_blank"
          rel="noreferrer"
          className="truncate text-xs font-medium text-lamaSky underline"
          title={submission.fileName}
        >
          {submission.student.name} {submission.student.surname}
        </a>
      ))}
    </div>
  );
};

export default AssignmentSubmissionsCell;
