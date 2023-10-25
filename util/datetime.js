const addDateFunctions = () => {
  Date.prototype.addMonths = function (months) {
    const date = new Date(this.valueOf());
    date.setMonth(date.getMonth() + months);
    return date;
  };

  Date.prototype.addDays = function (days) {
    const date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
  };

  Date.prototype.addHours = function (hours) {
    const date = new Date(this.valueOf());
    date.setHours(date.getHours() + hours);
    return date;
  };

  Date.prototype.addMinutes = function (minutes) {
    const date = new Date(this.valueOf());
    date.setMinutes(date.getMinutes() + minutes);
    return date;
  };

  Date.prototype.isBefore = function (maxDate = new Date()) {
    return this <= maxDate;
  };
};

export default addDateFunctions;
