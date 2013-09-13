var emittedObject = {
    addedCount: 1,
    removed: [],
    added: [this]
};

emit('todos:created', emittedObject);
