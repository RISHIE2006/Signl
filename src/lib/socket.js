let io = null;

export function setSocketIO(server) {
  io = server;
}

export function getIO() {
  return io;
}

export function emitToUser(userId, event, data) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

export function emitToUserApps(userId, event, data) {
  if (io) {
    io.to(`apps:${userId}`).emit(event, data);
  }
}

export function emitToUserNotifications(userId, event, data) {
  if (io) {
    io.to(`notifications:${userId}`).emit(event, data);
  }
}

export function broadcast(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

export const SocketEvents = {
  APPLICATION_CREATED: 'application:created',
  APPLICATION_UPDATED: 'application:updated',
  APPLICATION_DELETED: 'application:deleted',
  ANALYSIS_COMPLETED: 'analysis:completed',
  PREP_CREATED: 'prep:created',
  NOTIFICATION: 'notification',
  USER_PRESENCE: 'user:presence',
};