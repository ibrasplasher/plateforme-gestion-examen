import React, { useState } from "react";

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    class: "",
  });

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    class: "",
  });

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = "Le prénom est requis.";
    if (!formData.lastName) newErrors.lastName = "Le nom est requis.";
    if (!formData.email) newErrors.email = "L'email est requis.";
    if (!formData.phone) newErrors.phone = "Le numéro de téléphone est requis.";
    if (!formData.password) newErrors.password = "Le mot de passe est requis.";
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
    }
    if (!formData.class) newErrors.class = "La classe est requise.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      console.log("Form submitted", formData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Prénom</label>
        <input
          type="text"
          className="form-control"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
        />
        {errors.firstName && (
          <small className="text-danger">{errors.firstName}</small>
        )}
      </div>

      <div className="form-group">
        <label>Nom</label>
        <input
          type="text"
          className="form-control"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
        />
        {errors.lastName && (
          <small className="text-danger">{errors.lastName}</small>
        )}
      </div>

      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          className="form-control"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />
        {errors.email && <small className="text-danger">{errors.email}</small>}
      </div>

      <div className="form-group">
        <label>Numéro de téléphone</label>
        <input
          type="text"
          className="form-control"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
        />
        {errors.phone && <small className="text-danger">{errors.phone}</small>}
      </div>

      <div className="form-group">
        <label>Mot de passe</label>
        <input
          type="password"
          className="form-control"
          name="password"
          value={formData.password}
          onChange={handleChange}
        />
        {errors.password && (
          <small className="text-danger">{errors.password}</small>
        )}
      </div>

      <div className="form-group">
        <label>Confirmer le mot de passe</label>
        <input
          type="password"
          className="form-control"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
        />
        {errors.confirmPassword && (
          <small className="text-danger">{errors.confirmPassword}</small>
        )}
      </div>

      <div className="form-group">
        <label>Classe</label>
        <input
          type="text"
          className="form-control"
          name="class"
          value={formData.class}
          onChange={handleChange}
        />
        {errors.class && <small className="text-danger">{errors.class}</small>}
      </div>

      <button type="submit" className="btn btn-primary">
        S'inscrire
      </button>
    </form>
  );
};

export default RegistrationForm;
