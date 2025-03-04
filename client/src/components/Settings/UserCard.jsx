import React from "react";

const UserCard = ({user, onDelete}) => {
  const {_id, email, firstName, lastName, phone, countryKey, administrator, operator} = user;

  const handleDelete = () => {
    onDelete(_id);
  };

  return (
    <div className="card p-3 mb-3">
      <h5 className="card-title">{`${firstName} ${lastName}`}</h5>
      <p className="card-text">
        <strong>Email:</strong> {email}
      </p>
      <p className="card-text">
        <strong>Phone:</strong> {phone || "N/A"}
      </p>
      <p className="card-text">
        <strong>Country Key:</strong> {countryKey || "N/A"}
      </p>
      <p className="card-text">
        <strong>Administrator:</strong> {administrator ? "Yes" : "No"}
      </p>
      <p className="card-text">
        <strong>Operator:</strong> {operator ? "Yes" : "No"}
      </p>
      <button className="btn btn-danger" onClick={handleDelete}>
        Delete
      </button>
    </div>
  );
};

export default UserCard;
