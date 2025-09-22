import pool from '../config/database';

export interface Match {
  id: number;
  user1_id: number;
  user2_id: number;
  status: 'pending' | 'matched' | 'rejected';
  created_at: Date;
}

export interface CreateMatchData {
  user1_id: number;
  user2_id: number;
  status?: 'pending' | 'matched' | 'rejected';
}

export class MatchModel {
  static async create(matchData: CreateMatchData): Promise<Match> {
    const { user1_id, user2_id, status = 'pending' } = matchData;
    
    const query = `
      INSERT INTO matches (user1_id, user2_id, status)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await pool.query(query, [user1_id, user2_id, status]);
    return result.rows[0];
  }

  static async findExistingMatch(user1Id: number, user2Id: number): Promise<Match | null> {
    const query = `
      SELECT * FROM matches 
      WHERE (user1_id = $1 AND user2_id = $2) 
         OR (user1_id = $2 AND user2_id = $1)
    `;
    const result = await pool.query(query, [user1Id, user2Id]);
    return result.rows[0] || null;
  }

  static async findUserMatches(userId: number): Promise<Match[]> {
    const query = `
      SELECT m.*, 
             p1.name as user1_name, p1.profile_photo_url as user1_photo,
             p2.name as user2_name, p2.profile_photo_url as user2_photo
      FROM matches m
      LEFT JOIN profiles p1 ON m.user1_id = p1.user_id
      LEFT JOIN profiles p2 ON m.user2_id = p2.user_id
      WHERE (m.user1_id = $1 OR m.user2_id = $1) 
        AND m.status = 'matched'
      ORDER BY m.created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async findUserInteractions(userId: number): Promise<number[]> {
    const query = `
      SELECT DISTINCT 
        CASE 
          WHEN user1_id = $1 THEN user2_id
          ELSE user1_id
        END as other_user_id
      FROM matches
      WHERE user1_id = $1 OR user2_id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows.map(row => row.other_user_id);
  }

  static async updateStatus(matchId: number, status: 'pending' | 'matched' | 'rejected'): Promise<Match> {
    const query = `
      UPDATE matches 
      SET status = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, matchId]);
    return result.rows[0];
  }

  static async delete(matchId: number): Promise<void> {
    const query = 'DELETE FROM matches WHERE id = $1';
    await pool.query(query, [matchId]);
  }
}
