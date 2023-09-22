export const arrayToHash = (
    array,
    key = "name",
    getValue = obj => obj.id,
    { capitalizeKey = true } = {}
  ) =>
    array.reduce((hash, row) => {
      let keyName = row[key];
      if (capitalizeKey) keyName = keyName.toUpperCase();
      hash[keyName] = getValue(row);
      return hash;
    }, {});
  
  export const objectSwap = object =>
    Object.entries(object).reduce((swapped, entry) => {
      const [key, value] = entry;
      swapped[value] = key;
      return swapped;
    }, {});
  