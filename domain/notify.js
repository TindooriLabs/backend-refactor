// import app from "../app.js";
// import { getUserDevices } from "../database/queries/relationship.js";

// //Notification: {type: Joi.string(), recipients: Joi.array().items({id: 1234, name: 'Elmo'}), body: Joi.any}
// export const sendNotification = async (notification) => {
//   const io = app.get("io");
//   try {
//     await Promise.all(
//       notification.recipients.map(async (recipient) => {
//         const roomId = recipient.id.toString();
//         //Check connected sockets for each recipient
//         const socketConnections = await getSocketConnectionsForRoom(io, roomId);

//         //If at least one socket is connected, add them to the socket recipients
//         if (socketConnections.length) {
//           return io.to(roomId);
//         } else {
//           //Send async notification
//           return sendPushNotificationToUser(recipient.id, notification);
//         }
//       })
//     );
//   } catch (error) {
//     console.log("Error queueing notifications.", error);
//   }

//   //Emit the notification to the recipients
//   try {
//     io.emit(notification.type, notification.body);
//   } catch (error) {
//     console.log(
//       `Error emitting socket '${notification.type}' notification.`,
//       error,
//       notification.recipients
//     );
//   }
// };

// const getSocketConnectionsForRoom = (io, roomId) => {
//   return io.in(roomId).fetchSockets();
// };

// const sendPushNotificationToUser = async (userId, notification) => {
//   const getDevicesResult = await getUserDevices(userId);

//   const { devices } = getDevicesResult;

//   if (!devices?.length) {
//     return;
//   }

//   try {
//     await Promise.all(
//       devices.map(async (device) => {
//         if (device.kind === "IOS") {
//           return sendApn(device.id, notification);
//         }
//       })
//     );
//   } catch (error) {
//     console.log("Error sending notifications.", error);
//   }

//   return getDevicesResult;
// };

// const sendApn = (apnId, notification) => {
//   const apnClient = app.get("apnClient");
//   return apnClient.send(notification, apnId);
// };
