import { App, NewApp } from '../../interfaces';

export const newAppTemplate: NewApp = {
  name: '',
  url: '',
  icon: '',
  isPublic: true,
  description: '',
};

export const appTemplate: App = {
  // base fields
  id: 0,
  createdAt: new Date(),
  updatedAt: new Date(),

  ...newAppTemplate,

  // required on full App
  categoryId: 0,        // temporary placeholder; real value comes from form/API

  // App-only fields
  isPinned: false,
  orderId: 0,
};
