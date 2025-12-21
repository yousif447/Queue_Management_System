/**
 * Socket.IO Handler for Real-time Queue Updates
 * 
 * Events documented in project documentation:
 * Client → joinClinic (join room by clinicId/businessId)
 * Server → ticketCreated
 * Server → ticketUpdated
 * Client → callNext (staff action)
 */

const socketHandler = (io) => {
  // Store connected users
  const connectedUsers = new Map();

  io.on("connection", (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // =========================================
    // JOIN BUSINESS/CLINIC ROOM
    // Client → joinClinic (join room by businessId)
    // =========================================
    socket.on("joinBusiness", (data) => {
      const { businessId, userId, role } = data;
      
      if (!businessId) {
        socket.emit("error", { message: "businessId is required" });
        return;
      }

      // Join the business room
      socket.join(`business_${businessId}`);
      
      // Track connected user
      connectedUsers.set(socket.id, {
        businessId,
        userId,
        role,
        joinedAt: new Date(),
      });

      console.log(`👤 User ${userId || socket.id} joined business room: ${businessId}`);

      // Notify room about new connection
      socket.to(`business_${businessId}`).emit("userJoined", {
        userId,
        role,
        timestamp: new Date(),
      });

      // Confirm join to client
      socket.emit("joinedBusiness", {
        success: true,
        businessId,
        message: `Successfully joined business ${businessId}`,
      });
    });

    // Alias for documentation compatibility
    socket.on("joinClinic", (data) => {
      socket.emit("joinBusiness", { ...data, businessId: data.clinicId || data.businessId });
    });

    // =========================================
    // LEAVE BUSINESS ROOM
    // =========================================
    socket.on("leaveBusiness", (data) => {
      const { businessId } = data;
      
      socket.leave(`business_${businessId}`);
      connectedUsers.delete(socket.id);

      console.log(`👋 Client ${socket.id} left business: ${businessId}`);
    });

    // =========================================
    // CALL NEXT TICKET (Staff Action)
    // Client → callNext
    // =========================================
    socket.on("callNext", async (data) => {
      const { businessId, queueId, staffId } = data;

      if (!businessId) {
        socket.emit("error", { message: "businessId is required" });
        return;
      }

      // Emit to the business room that next ticket is being called
      io.to(`business_${businessId}`).emit("ticketCalling", {
        queueId,
        staffId,
        timestamp: new Date(),
      });

      console.log(`📢 Staff ${staffId} calling next ticket for business ${businessId}`);
    });

    // =========================================
    // JOIN USER'S PERSONAL ROOM (for notifications)
    // =========================================
    socket.on("joinUserRoom", (data) => {
      // DEBUG: Echo back to client
      let parsedData = data;
      if (typeof data === 'string') {
          try {
              parsedData = JSON.parse(data);
          } catch (e) {
              // ignore
          }
      }

      socket.emit("debug_error", { 
          source: "server_received", 
          dataType: typeof data, 
          dataContent: parsedData || data 
      });

      const { userId } = parsedData || {};
      
      if (!userId) {
        socket.emit("error", { 
            message: "userId is required for personal room", 
            debug: { received: parsedData, originalType: typeof data } 
        });
        return;
      }

      const roomName = `user_${String(userId)}`;
      socket.join(roomName);
      console.log(`👤 Socket ${socket.id} joined personal room: ${roomName}`);
      
      // Confirm to user
      socket.emit("joinedUserRoom", { success: true, room: roomName });
    });

    // =========================================
    // REQUEST QUEUE STATUS
    // =========================================
    socket.on("getQueueStatus", (data) => {
      const { businessId, queueId } = data;
      
      // This would typically fetch from database
      // For now, emit request to be handled by server
      socket.emit("queueStatusRequested", { businessId, queueId });
    });

    // =========================================
    // DISCONNECT
    // =========================================
    socket.on("disconnect", () => {
      const userData = connectedUsers.get(socket.id);
      
      if (userData) {
        console.log(`❌ User ${userData.userId || socket.id} disconnected from business ${userData.businessId}`);
        
        // Notify business room
        socket.to(`business_${userData.businessId}`).emit("userLeft", {
          userId: userData.userId,
          timestamp: new Date(),
        });
      }

      connectedUsers.delete(socket.id);
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });

    // =========================================
    // PING/PONG for connection health
    // =========================================
    socket.on("ping", () => {
      socket.emit("pong", { timestamp: new Date() });
    });
  });

  // =========================================
  // HELPER FUNCTIONS TO EMIT FROM CONTROLLERS
  // =========================================
  
  return {
    // Server → ticketCreated
    emitTicketCreated: (businessId, ticket) => {
      io.to(`business_${businessId}`).emit("ticketCreated", {
        ticket,
        timestamp: new Date(),
      });
      console.log(`📤 Emitted ticketCreated to business ${businessId}`);
    },

    // Server → ticketUpdated
    emitTicketUpdated: (businessId, ticket) => {
      io.to(`business_${businessId}`).emit("ticketUpdated", {
        ticket,
        timestamp: new Date(),
      });
      console.log(`📤 Emitted ticketUpdated to business ${businessId}`);
    },

    // Emit ticket called (when staff calls next)
    emitTicketCalled: (businessId, ticket, userId) => {
      // Emit to business room
      io.to(`business_${businessId}`).emit("ticketCalled", {
        ticket,
        timestamp: new Date(),
      });

      // Also emit directly to user if they're connected
      if (userId) {
        io.to(`user_${userId}`).emit("yourTicketCalled", {
          ticket,
          message: "Your ticket has been called! Please proceed to the counter.",
          timestamp: new Date(),
        });
      }
      console.log(`📤 Emitted ticketCalled to business ${businessId}`);
    },

    // Emit queue status update
    emitQueueUpdate: (businessId, queueData) => {
      io.to(`business_${businessId}`).emit("queueUpdated", {
        queue: queueData,
        timestamp: new Date(),
      });
      console.log(`📤 Emitted queueUpdated to business ${businessId}`);
    },

    // Emit notification to specific user
    emitToUser: (userId, event, data) => {
      const roomName = `user_${String(userId)}`;
      io.to(roomName).emit(event, {
        ...data,
        timestamp: new Date(),
      });
      console.log(`📤 Emitted ${event} to ${roomName}`);
    },

    // Get connected users count for a business
    getBusinessConnectionsCount: (businessId) => {
      const room = io.sockets.adapter.rooms.get(`business_${businessId}`);
      return room ? room.size : 0;
    },

    // Get all connected users
    getConnectedUsers: () => connectedUsers,

    // =========================================
    // BUSINESS UPDATES (for homepage real-time updates)
    // =========================================
    
    // Emit when a new business is created
    emitBusinessCreated: (business) => {
      io.emit("businessCreated", {
        business,
        timestamp: new Date(),
      });
      console.log(`📤 Emitted businessCreated: ${business.name}`);
    },

    // Emit when a business is updated
    emitBusinessUpdated: (business) => {
      io.emit("businessUpdated", {
        business,
        timestamp: new Date(),
      });
      console.log(`📤 Emitted businessUpdated: ${business.name}`);
    },

    // Emit when a business is deleted
    emitBusinessDeleted: (businessId) => {
      io.emit("businessDeleted", {
        businessId,
        timestamp: new Date(),
      });
      console.log(`📤 Emitted businessDeleted: ${businessId}`);
    },
  };
};

module.exports = socketHandler;
