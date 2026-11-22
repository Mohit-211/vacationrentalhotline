import React from "react";

const MappingExample = () => {
  return (
    <div className="CSvFile">
      <h5> Matching Fields with CSV Column Names</h5>
      <p>
        You can download the sample CSV file to understand the structure and
        format of the data.
      </p>
      <div>
        <a href="/Propertysample.csv" download>
          <h6 style={{ width: "fit-content",color:"#00a556",textDecoration:"underline" }} >Download the sample CSV by clicking here</h6>
        </a>
      </div>
      <p>
        {" "}
        This file has column headings that represent different types of
        information. If you're uploading your own sheet, you’ll need to follow a
        similar process by matching the fields on the website with the correct
        column names in your CSV file.
      </p>
      <p>Here’s what we mean by matching fields with column names:</p>
      <ul>
        <li>
          The <b>Primary Email</b> column in the CSV matches with the field{" "}
          <b>Email 1</b> on the website.
        </li>
        <li>
          The <b>Secondary Email</b> column in the CSV matches with the field{" "}
          <b>Email 2</b>.
        </li>
        <li>
          The <b>Primary Phone Number</b> column in the CSV matches with the
          field <b>Phone Number 1</b>.
        </li>
        <li>
          The <b>Secondary Phone Number</b> column in the CSV matches with the
          field <b>Phone Number 2</b>.
        </li>
        <li>
          The <b>Postal Code</b> column in the CSV matches with the field{" "}
          <b>ZIP Code</b>.
        </li>
      </ul>
      <p>
        When you click on a field on the website (like Email 1), a dropdown will
        appear listing all the column names from your CSV file.
      </p>
      <p>
        Select the column name that contains the relevant data for that field.
        <b>For example</b> if your CSV has a column named <b>"Primary Email"</b>{" "}
        or <b>"Email"</b>, select it for the <b>Email 1 field</b>.
      </p>
      <p>
        This process ensures that the data from your CSV is correctly imported
        into the corresponding fields on the website.
      </p>
      <p>
        Repeat this step for all required and optional fields, then click
        <b> Done </b> to complete the import.
      </p>
      <p>
        If you use your own sheet, simply ensure that each field on the website
        is matched with the most relevant column name from your file.
      </p>
    </div>
  );
};

export default MappingExample;
