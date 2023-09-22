export const getDistanceBetweenUsers = (user1, user2) => {
    const { lastLat: user1Lat, lastLon: user1Lon } = user1;
    const { lastLat: user2Lat, lastLon: user2Lon } = user2;
  
    return parseFloat(getDistance(user1Lat, user1Lon, user2Lat, user2Lon).toFixed(3));
  };
  
  export const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3960; // Radius of the earth in miles
    const dLat = deg2rad(lat2 - lat1); // deg2rad below
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in miles
    return distance;
  };
  
  const deg2rad = deg => {
    return deg * (Math.PI / 180);
  };
  