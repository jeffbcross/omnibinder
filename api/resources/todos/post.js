var emittedObject = {
    addedCount: 1,
    removed: [],
    added: [this]
};

emit('todos:updated', emittedObject);
