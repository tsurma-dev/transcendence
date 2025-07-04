import { passwordField, usernameField, emailField } from "./fields.js";

export const registerUserSchema = {
  body: {
    type: "object",
    required: ["username", "email", "password"],
    properties: {
      username: usernameField,
      email: emailField,
      password: passwordField,
    },
  },
};

export const loginUserSchema = {
  body: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: emailField,
      password: passwordField,
    },
  },
};

export const changePasswordSchema = {
  body: {
    type: "object",
    required: ["password"],
    properties: {
      password: passwordField,
    },
  },
};

export const changeUsernameSchema = {
  body: {
    type: "object",
    required: ["username"],
    properties: {
      username: usernameField,
    },
  },
};

export const changeEmailSchema = {
  body: {
    type: "object",
    required: ["email"],
    properties: {
      email: emailField,
    },
  },
};
