import net from 'net';
import prisma from '../utils/prisma';

interface AGIRequest {
  [key: string]: string;
}

class AGIServer {
  private server: net.Server;
  private port: number;

  constructor(port: number = 4573) {
    this.port = port;
    this.server = net.createServer(this.handleConnection.bind(this));
  }

  private parseAGIRequest(data: string): AGIRequest {
    const lines = data.split('\n');
    const request: AGIRequest = {};

    for (const line of lines) {
      if (line.trim() === '') break;
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        request[key.trim()] = valueParts.join(':').trim();
      }
    }

    return request;
  }

  private async handleConnection(socket: net.Socket) {
    console.log('AGI connection established');

    let buffer = '';

    socket.on('data', async (chunk) => {
      buffer += chunk.toString();

      if (buffer.includes('\n\n')) {
        const request = this.parseAGIRequest(buffer);
        
        try {
          await this.processCall(socket, request);
        } catch (error) {
          console.error('Error processing call:', error);
          this.sendCommand(socket, 'VERBOSE "Error processing call" 1');
        }

        socket.end();
      }
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err);
    });
  }

  private async processCall(socket: net.Socket, request: AGIRequest) {
    const callerNumber = request['agi_callerid'];
    const didNumber = request['agi_extension'] || request['agi_dnid'];

    console.log(`Processing call: ${callerNumber} -> ${didNumber}`);

    // Look up allocation number
    const allocation = await prisma.allocationNumber.findFirst({
      where: {
        allocatedNumber: didNumber,
        status: 'active',
      },
      include: {
        destination: true,
      },
    });

    if (!allocation || !allocation.destination) {
      this.sendCommand(socket, 'VERBOSE "No valid destination found" 1');
      this.sendCommand(socket, 'SET VARIABLE ROUTING_RESULT "no_destination"');
      return;
    }

    const destination = allocation.destination;

    // Check channel capacity
    if (destination.currentChannels >= destination.maxChannels) {
      this.sendCommand(socket, 'VERBOSE "Destination at capacity" 1');
      this.sendCommand(socket, 'SET VARIABLE ROUTING_RESULT "capacity_exceeded"');
      return;
    }

    // Set routing variables based on routing type
    this.sendCommand(socket, `SET VARIABLE ROUTING_TYPE "${destination.routingType}"`);
    this.sendCommand(socket, `SET VARIABLE DESTINATION_NUMBER "${destination.destinationNumber}"`);
    this.sendCommand(socket, `SET VARIABLE DESTINATION_ID "${destination.id}"`);
    this.sendCommand(socket, `SET VARIABLE ALLOCATION_ID "${allocation.id}"`);
    this.sendCommand(socket, 'SET VARIABLE ROUTING_RESULT "success"');

    console.log(`Routed to ${destination.destinationNumber} via ${destination.routingType}`);
  }

  private sendCommand(socket: net.Socket, command: string): void {
    socket.write(command + '\n');
  }

  public start(): void {
    this.server.listen(this.port, () => {
      console.log(`🎯 AGI Server listening on port ${this.port}`);
    });
  }

  public stop(): void {
    this.server.close(() => {
      console.log('AGI Server stopped');
    });
  }
}

// Start the AGI server
if (require.main === module) {
  const port = parseInt(process.env.AGI_PORT || '4573', 10);
  const agiServer = new AGIServer(port);
  agiServer.start();

  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully');
    agiServer.stop();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully');
    agiServer.stop();
    process.exit(0);
  });
}

export default AGIServer;
