USE voting_system;

-- Insert admin user (password: admin123)
INSERT INTO profiles (email, password_hash, full_name, student_id, phone, is_verified)
VALUES ('admin@votingsystem.com', '$2a$10$xXJOHQbPz7FQnABvD9xkkeGJQO8ygP.YxF3u4.TqKC8XZ5jkWCG8K', 'System Admin', 'ADMIN001', '+1234567890', TRUE);

SET @admin_id = LAST_INSERT_ID();

-- Assign admin role
INSERT INTO user_roles (user_id, role) VALUES (@admin_id, 'admin');

-- Insert sample candidates
INSERT INTO candidates (name, position, manifesto, photo_url) VALUES
('John Smith', 'president', 'Committed to enhancing student welfare and academic excellence. Will focus on improving campus facilities and creating more opportunities for student engagement.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'),
('Sarah Johnson', 'president', 'Passionate about student rights and sustainability. Plans to implement eco-friendly initiatives and strengthen student voice in university decisions.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'),

('Michael Chen', 'vice_president', 'Experienced leader with a vision for digital transformation. Will work to modernize student services and improve communication channels.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'),
('Emily Rodriguez', 'vice_president', 'Dedicated to fostering inclusivity and diversity. Aims to create safe spaces and expand support systems for all students.', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400'),

('David Kim', 'secretary', 'Detail-oriented with strong organizational skills. Will ensure transparent record-keeping and efficient administrative processes.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'),
('Lisa Anderson', 'secretary', 'Committed to clear communication and accessibility. Plans to digitize records and improve information flow to students.', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'),

('James Wilson', 'treasurer', 'Finance major with practical experience. Will focus on budget transparency and maximizing value for student funds.', 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400'),
('Maria Garcia', 'treasurer', 'Passionate about financial literacy. Plans to implement student financial education programs and ensure responsible budget management.', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400');

-- Insert sample voter (password: voter123)
INSERT INTO profiles (email, password_hash, full_name, student_id, phone, is_verified)
VALUES ('voter@example.com', '$2a$10$4EqfZ1gN8CJqFmkfVxJe7.9eXjO5J4c5N6fO1qK7xCK9Z5jkWCG8K', 'Test Voter', 'STU001', '+1234567891', TRUE);

SET @voter_id = LAST_INSERT_ID();

-- Assign voter role
INSERT INTO user_roles (user_id, role) VALUES (@voter_id, 'voter');
