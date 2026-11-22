const steps = [
  {
    title: "Open the Upload Section:",
    text: "Turn on Switch to CSV Upload at the top of the page to begin the upload process.",
  },
  {
    title: "Select a Field on the Form:",
    text: "Look at the form with fields listed on the page. Fields marked with * are required, while others are optional.",
  },
  {
    title: "Map CSV Columns to Form Fields:",
    items: [
      "Click on any form field to open a dropdown.",
      "In this dropdown, you’ll see all the column names from your CSV’s first row.",
      "Select the column name that matches the data for that field. (For example, if your CSV contains a column named Primary Email, select it for the Email 1 field)",
    ],
  },
  {
    title: "Repeat for Each Field:",
    text: "Go through all required fields, making sure each one is mapped to a matching column in your CSV. Map optional fields if you have relevant data for them.",
  },
  {
    title: "Review Your Selections:",
    text: "Double-check that each required field has been mapped to a CSV column with the correct data.",
  },
  {
    title: "Click “Submit” to Import:",
    text: "Once all fields are mapped, click the Submit button. Your properties will now be imported and saved.",
  },
];

const CsvInstructions = () => {
  return (
    <div>
      <h2 className="text-lg font-bold">How to Upload Properties with CSV:</h2>
      <ol className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <li className="flex gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary-stronger">
            1
          </span>
          <div>
            Ensure your CSV file is ready with property data. The first row should contain column names that describe
            each type of information, such as:
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Rental Property Owner Name</li>
              <li>Primary Email, Secondary Email</li>
              <li>Primary Phone Number, Secondary Phone Number</li>
              <li>Property Address Line 1, Property Address Line 2</li>
              <li>City, State, Postal Code, Country</li>
            </ul>
          </div>
        </li>
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary-stronger">
              {index + 2}
            </span>
            <div>
              <strong className="font-semibold text-foreground">{step.title}</strong> {step.text}
              {step.items && (
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {step.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default CsvInstructions;
