import { Download } from "lucide-react";

const mappings = [
  ["Primary Email", "Email 1"],
  ["Secondary Email", "Email 2"],
  ["Primary Phone Number", "Phone Number 1"],
  ["Secondary Phone Number", "Phone Number 2"],
  ["Postal Code", "ZIP Code"],
];

const MappingExample = () => {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
      <h3 className="text-base font-bold">Matching Fields with CSV Column Names</h3>
      <p>You can download the sample CSV file to understand the structure and format of the data.</p>
      <a
        href="/property-import-sample.csv"
        download
        className="inline-flex items-center gap-2 font-semibold text-primary-strong underline-offset-4 hover:text-primary-stronger hover:underline"
      >
        <Download className="size-4" aria-hidden="true" />
        Download the sample CSV by clicking here
      </a>
      <p>
        This file has column headings that represent different types of information. If you&apos;re uploading your own
        sheet, you’ll need to follow a similar process by matching the fields on the website with the correct column
        names in your CSV file.
      </p>
      <p>Here’s what we mean by matching fields with column names:</p>
      <table className="w-full overflow-hidden rounded-lg border border-border text-left">
        <thead className="bg-surface-muted text-foreground">
          <tr>
            <th className="px-3 py-2 font-semibold">CSV column</th>
            <th className="px-3 py-2 font-semibold">Field on the website</th>
          </tr>
        </thead>
        <tbody>
          {mappings.map(([column, field]) => (
            <tr key={column} className="border-t border-border">
              <td className="px-3 py-2 font-semibold text-foreground">{column}</td>
              <td className="px-3 py-2">{field}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        When you click on a field on the website (like Email 1), a dropdown will appear listing all the column names
        from your CSV file.
      </p>
      <p>
        Select the column name that contains the relevant data for that field.{" "}
        <strong className="text-foreground">For example</strong> if your CSV has a column named{" "}
        <strong className="text-foreground">&ldquo;Primary Email&rdquo;</strong> or{" "}
        <strong className="text-foreground">&ldquo;Email&rdquo;</strong>, select it for the{" "}
        <strong className="text-foreground">Email 1 field</strong>.
      </p>
      <p>
        This process ensures that the data from your CSV is correctly imported into the corresponding fields on the
        website.
      </p>
      <p>
        Repeat this step for all required and optional fields, then click{" "}
        <strong className="text-foreground">Submit</strong> to complete the import.
      </p>
      <p>
        If you use your own sheet, simply ensure that each field on the website is matched with the most relevant column
        name from your file.
      </p>
    </div>
  );
};

export default MappingExample;
