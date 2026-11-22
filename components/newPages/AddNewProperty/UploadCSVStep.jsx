import React from "react";

const UploadCSVStep = () => {
  return (
    <div>
      <div>
        <ul>
          <h3>How to Upload Properties with CSV:</h3>
          <li>
            Ensure your CSV file is ready with property data.
            <ul>
              The first row should contain column names that describe each type
              of information, such as:
              <li>Rental Property Owner Name</li>
              <li>Primary Email, Secondary Email</li>
              <li>Primary Phone Number, Secondary Phone Number</li>
              <li>Property Address Line 1, Property Address Line 2</li>
              <li>City, State, Postal Code, Country</li>
            </ul>
          </li>
          <li>
            <b>Open the Upload Section:</b> Click the Upload button at the top
            of the page to begin the upload process.
          </li>
          <li>
            <b>Select a Field on the Form:</b> Look at the form with fields
            listed on the page. Fields marked with * are required, while others
            are optional.
          </li>
          <li>
            <ul>
              <b>Map CSV Columns to Form Fields: </b>
              <li>Click on any form field to open a dropdown.</li>
              <li>
                In this dropdown, you’ll see all the column names from your
                CSV’s first row.
              </li>
              <li>
                Select the column name that matches the data for that field.
                (For example, if your CSV contains a column named Primary Email,
                select it for the Email 1 field)
              </li>
            </ul>
          </li>
          <li>
            <b>Repeat for Each Field:</b> Go through all required fields, making
            sure each one is mapped to a matching column in your CSV. Map
            optional fields if you have relevant data for them.
          </li>
          <li>
            <b>Review Your Selections:</b> Double-check that each required field
            has been mapped to a CSV column with the correct data.
          </li>
          <li>
            <b>Click "Done" to Import: </b> Once all fields are mapped, click
            the Done button. Your properties will now be imported and saved.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default UploadCSVStep;
