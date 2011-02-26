// A simple module to replace `Backbone.sync` with *appStorage*-based
// persistence. Models are given GUIDS, and saved into an object. Simple
// as that.

// Generate four random hex digits.
function S4() {
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
};

// Generate a pseudo-GUID by concatenating random hexadecimal.
function guid() {
   return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
};

// Our Store is represented by a single JS object in *appStorage*. Create it
// with a meaningful name, like the name you'd give a table.
var Store = function(name) {
  this.name = name;
};

_.extend(Store.prototype, {

  // Save the current state of the **Store** to *appStorage*.
  save: function() {
    this.load();
    appStorage.setItem(this.name, this.data);
  },

  // Add a model, giving it a (hopefully)-unique GUID, if it doesn't already
  // have an id of it's own.
  create: function(model) {
    if (!model.id) model.id = model.attributes.id = guid();
    this.load();
    this.data[model.id] = model;
    this.save();
    return model;
  },

  // Update a model by replacing its copy in `this.data`.
  update: function(model) {
    this.load();
    this.data[model.id] = model;
    this.save();
    return model;
  },

  // Retrieve a model from `this.data` by id.
  find: function(model) {
    this.load();
    return this.data[model.id];
  },

  // Return the array of all models currently in storage.
  findAll: function() {
    this.load();
    return _.values(this.data);
  },

  // Delete a model from `this.data`, returning it.
  destroy: function(model) {
    this.load();
    delete this.data[model.id];
    this.save();
    return model;
  },

  // Load data
  load: function() {
    if (!this.data) {
      var store = appStorage.getItem(this.name);
      this.data = store || {};
    }
  }

});

// Override `Backbone.sync` to use delegate to the model or collection's
// *appStorage* property, which should be an instance of `Store`.
Backbone.sync = function(method, model, options) {

  var resp;
  var store = model.appStorage || model.collection.appStorage;

  switch (method) {
    case "read":    resp = model.id ? store.find(model) : store.findAll(); break;
    case "create":  resp = store.create(model);                            break;
    case "update":  resp = store.update(model);                            break;
    case "delete":  resp = store.destroy(model);                           break;
  }

  if (resp) {
    options.success(resp);
  } else {
    options.error("Record not found");
  }
};
