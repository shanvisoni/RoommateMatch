import pool from '../config/database';

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: Date;
}

export interface CreateMessageData {
  sender_id: number;
  receiver_id: number;
  content: string;
}

export class MessageModel {
  static async create(messageData: CreateMessageData): Promise<Message> {
    const { sender_id, receiver_id, content } = messageData;
    
    const query = `
      INSERT INTO messages (sender_id, receiver_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await pool.query(query, [sender_id, receiver_id, content]);
    return result.rows[0];
  }

  static async findConversation(user1Id: number, user2Id: number): Promise<Message[]> {
    const query = `
      SELECT m.*, 
             p1.name as sender_name, p1.profile_photo_url as sender_photo,
             p2.name as receiver_name, p2.profile_photo_url as receiver_photo
      FROM messages m
      LEFT JOIN profiles p1 ON m.sender_id = p1.user_id
      LEFT JOIN profiles p2 ON m.receiver_id = p2.user_id
      WHERE (m.sender_id = $1 AND m.receiver_id = $2) 
         OR (m.sender_id = $2 AND m.receiver_id = $1)
      ORDER BY m.created_at ASC
    `;
    const result = await pool.query(query, [user1Id, user2Id]);
    return result.rows;
  }

  static async findUserChatRooms(userId: number): Promise<any[]> {
    const query = `
      WITH chat_partners AS (
        SELECT DISTINCT 
          CASE 
            WHEN sender_id = $1 THEN receiver_id
            ELSE sender_id
          END as other_user_id,
          MAX(created_at) as last_message_time
        FROM messages
        WHERE sender_id = $1 OR receiver_id = $1
        GROUP BY other_user_id
      )
      SELECT 
        cp.other_user_id,
        p.name as other_user_name,
        p.profile_photo_url as other_user_photo,
        p.location as other_user_location,
        cp.last_message_time,
        m.content as last_message_content,
        m.sender_id as last_message_sender_id
      FROM chat_partners cp
      LEFT JOIN profiles p ON cp.other_user_id = p.user_id
      LEFT JOIN messages m ON (
        (m.sender_id = $1 AND m.receiver_id = cp.other_user_id) OR
        (m.sender_id = cp.other_user_id AND m.receiver_id = $1)
      ) AND m.created_at = cp.last_message_time
      ORDER BY cp.last_message_time DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async findById(id: number): Promise<Message | null> {
    const query = 'SELECT * FROM messages WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<void> {
    const query = 'DELETE FROM messages WHERE id = $1';
    await pool.query(query, [id]);
  }
}
