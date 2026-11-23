<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = getPDO();

    switch ($action) {
        case 'public_rates':
            $stmt = $pdo->query('SELECT rate_id, name, charge, description FROM rates ORDER BY rate_id');
            jsonResponse($stmt->fetchAll());
            break;

        case 'login':
            if ($method !== 'POST') jsonResponse(['error' => 'Method not allowed'], 405);
            $body = getJsonBody();
            $username = trim((string)($body['username'] ?? ''));
            $password = (string)($body['password'] ?? '');
            $roleType = $body['roleType'] ?? null;

            if ($username === '' || $password === '') {
                jsonResponse(['error' => 'Username and password are required'], 400);
            }

            $matched = null;
            if (!$roleType || $roleType === 'admin') {
                $stmt = $pdo->prepare('SELECT * FROM admin WHERE username = ? LIMIT 1');
                $stmt->execute([$username]);
                $adm = $stmt->fetch();
                if ($adm && verifyPassword($password, $adm['password'])) {
                    $matched = [
                        'id'        => (int)$adm['user_id'],
                        'username'  => $adm['username'],
                        'name'      => $adm['name'] ?: $adm['username'],
                        'email'     => $adm['email'],
                        'roleType'  => 'admin',
                        'roleLabel' => $adm['user_role'] ?: 'admin',
                    ];
                }
            }

            if (!$matched && (!$roleType || $roleType === 'staff')) {
                $stmt = $pdo->prepare('SELECT * FROM staffs WHERE username = ? LIMIT 1');
                $stmt->execute([$username]);
                $st = $stmt->fetch();
                if ($st && verifyPassword($password, $st['password'])) {
                    $matched = [
                        'id'        => (int)$st['staff_id'],
                        'username'  => $st['username'],
                        'name'      => $st['username'],
                        'email'     => $st['email'],
                        'roleType'  => 'staff',
                        'roleLabel' => $st['role'] ?: 'staff',
                    ];
                }
            }

            if (!$matched && (!$roleType || $roleType === 'member')) {
                $stmt = $pdo->prepare('SELECT * FROM members WHERE username = ? LIMIT 1');
                $stmt->execute([$username]);
                $mem = $stmt->fetch();
                if ($mem && verifyPassword($password, $mem['password'])) {
                    $matched = [
                        'id'        => (int)$mem['member_id'],
                        'username'  => $mem['username'],
                        'name'      => $mem['fullname'],
                        'roleType'  => 'member',
                        'roleLabel' => 'member',
                    ];
                }
            }

            if (!$matched) {
                jsonResponse(['error' => 'Invalid username or password'], 401);
            }

            session_regenerate_id(true);
            $_SESSION['user'] = $matched;
            jsonResponse(['user' => $matched]);
            break;

        case 'register':
            if ($method !== 'POST') jsonResponse(['error' => 'Method not allowed'], 405);
            $body = getJsonBody();
            $fullname = trim((string)($body['fullname'] ?? ''));
            $username = trim((string)($body['username'] ?? ''));
            $password = (string)($body['password'] ?? '');
            $contact  = trim((string)($body['contact_number'] ?? ''));
            $rateId   = !empty($body['rate_id']) ? (int)$body['rate_id'] : null;

            if ($fullname === '' || $username === '' || $password === '') {
                jsonResponse(['error' => 'Full name, username, and password are required'], 400);
            }

            $hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare(
                'INSERT INTO members (fullname, username, password, rate_id, contact_number, registration_date, status)
                 VALUES (?, ?, ?, ?, ?, CURRENT_DATE, "active")'
            );
            $stmt->execute([$fullname, $username, $hash, $rateId, $contact ?: null]);
            $newId = (int)$pdo->lastInsertId();

            $user = [
                'id'        => $newId,
                'username'  => $username,
                'name'      => $fullname,
                'roleType'  => 'member',
                'roleLabel' => 'member',
            ];
            $_SESSION['user'] = $user;
            jsonResponse(['user' => $user], 201);
            break;

        case 'me':
            jsonResponse(['user' => requireAuth()]);
            break;

        case 'logout':
            $_SESSION = [];
            session_destroy();
            jsonResponse(['ok' => true]);
            break;

        case 'dashboard':
            $user = requireAuth();
            if ($user['roleType'] === 'member') {
                $id = (int)$user['id'];
                $totalRevenue = (float)$pdo->query("SELECT COALESCE(SUM(amount),0) FROM transactions WHERE member_id = $id")->fetchColumn();
                $attCount = (int)$pdo->query("SELECT COUNT(*) FROM attendance WHERE member_id = $id")->fetchColumn();
                $presentToday = (int)$pdo->query("SELECT COUNT(*) FROM attendance WHERE member_id = $id AND attendance_date = CURRENT_DATE AND status = 'Present'")->fetchColumn();
                $pendingRem = (int)$pdo->query("SELECT COUNT(*) FROM reminder WHERE member_id = $id AND status = 'Pending'")->fetchColumn();
                $txStmt = $pdo->prepare('SELECT t.*, m.fullname AS member_name FROM transactions t JOIN members m ON t.member_id = m.member_id WHERE t.member_id = ? ORDER BY t.transaction_id DESC LIMIT 5');
                $txStmt->execute([$id]);
                $recentTx = $txStmt->fetchAll();
            } else {
                $totalRevenue = (float)$pdo->query('SELECT COALESCE(SUM(amount),0) FROM transactions')->fetchColumn();
                $attCount = (int)$pdo->query('SELECT COUNT(*) FROM attendance')->fetchColumn();
                $presentToday = (int)$pdo->query("SELECT COUNT(*) FROM attendance WHERE attendance_date = CURRENT_DATE AND status = 'Present'")->fetchColumn();
                $pendingRem = (int)$pdo->query("SELECT COUNT(*) FROM reminder WHERE status = 'Pending'")->fetchColumn();
                $recentTx = $pdo->query('SELECT t.*, m.fullname AS member_name FROM transactions t JOIN members m ON t.member_id = m.member_id ORDER BY t.transaction_id DESC LIMIT 5')->fetchAll();
            }

            $totalMembers = (int)$pdo->query('SELECT COUNT(*) FROM members')->fetchColumn();
            $activeMembers = (int)$pdo->query("SELECT COUNT(*) FROM members WHERE status = 'active'")->fetchColumn();
            $eqStats = $pdo->query('SELECT COALESCE(SUM(quantity),0) AS units, COALESCE(SUM(amount * quantity),0) AS val FROM equipment')->fetch();
            $recentAnn = $pdo->query('SELECT * FROM announcements ORDER BY announcement_date DESC, announcement_id DESC LIMIT 5')->fetchAll();
            $plans = $pdo->query('SELECT r.rate_id, r.name, r.charge, COUNT(m.member_id) AS memberCount FROM rates r LEFT JOIN members m ON m.rate_id = r.rate_id GROUP BY r.rate_id')->fetchAll();

            jsonResponse([
                'totalMembers'           => $totalMembers,
                'activeMembers'          => $activeMembers,
                'totalEquipmentUnits'    => (int)$eqStats['units'],
                'totalEquipmentValue'    => (float)$eqStats['val'],
                'totalRevenue'           => $totalRevenue,
                'presentToday'           => $presentToday,
                'attendanceRecordsCount' => $attCount,
                'pendingReminders'       => $pendingRem,
                'recentTransactions'     => $recentTx,
                'recentAnnouncements'    => $recentAnn,
                'planBreakdown'          => $plans,
            ]);
            break;

        case 'admins':
            requireRoles(['admin']);
            jsonResponse($pdo->query('SELECT user_id, username, name, email, user_role FROM admin ORDER BY user_id')->fetchAll());
            break;

        case 'members':
            $user = requireAuth();
            if ($method === 'GET') {
                if ($user['roleType'] === 'member') {
                    $stmt = $pdo->prepare('SELECT m.member_id, m.fullname, m.username, m.rate_id, m.contact_number, m.registration_date, m.status, r.name AS rate_name, r.charge AS rate_charge FROM members m LEFT JOIN rates r ON m.rate_id = r.rate_id WHERE m.member_id = ?');
                    $stmt->execute([$user['id']]);
                    jsonResponse($stmt->fetchAll());
                }
                $stmt = $pdo->query('SELECT m.member_id, m.fullname, m.username, m.rate_id, m.contact_number, m.registration_date, m.status, r.name AS rate_name, r.charge AS rate_charge FROM members m LEFT JOIN rates r ON m.rate_id = r.rate_id ORDER BY m.member_id DESC');
                jsonResponse($stmt->fetchAll());
            }
            requireRoles(['admin', 'staff']);
            $body = getJsonBody();
            if ($method === 'POST') {
                $hash = password_hash((string)$body['password'], PASSWORD_DEFAULT);
                $stmt = $pdo->prepare('INSERT INTO members (fullname, username, password, rate_id, contact_number, status) VALUES (?, ?, ?, ?, ?, ?)');
                $stmt->execute([
                    trim((string)$body['fullname']),
                    trim((string)$body['username']),
                    $hash,
                    !empty($body['rate_id']) ? (int)$body['rate_id'] : null,
                    trim((string)($body['contact_number'] ?? '')) ?: null,
                    ($body['status'] ?? 'active') === 'inactive' ? 'inactive' : 'active',
                ]);
                jsonResponse(['member_id' => (int)$pdo->lastInsertId()], 201);
            }
            if ($method === 'PUT') {
                $id = (int)($_GET['id'] ?? 0);
                if (!empty($body['password'])) {
                    $hash = password_hash((string)$body['password'], PASSWORD_DEFAULT);
                    $stmt = $pdo->prepare('UPDATE members SET fullname = ?, username = ?, password = ?, rate_id = ?, contact_number = ?, status = ? WHERE member_id = ?');
                    $stmt->execute([
                        trim((string)$body['fullname']),
                        trim((string)$body['username']),
                        $hash,
                        !empty($body['rate_id']) ? (int)$body['rate_id'] : null,
                        trim((string)($body['contact_number'] ?? '')) ?: null,
                        ($body['status'] ?? 'active') === 'inactive' ? 'inactive' : 'active',
                        $id,
                    ]);
                } else {
                    $stmt = $pdo->prepare('UPDATE members SET fullname = ?, username = ?, rate_id = ?, contact_number = ?, status = ? WHERE member_id = ?');
                    $stmt->execute([
                        trim((string)$body['fullname']),
                        trim((string)$body['username']),
                        !empty($body['rate_id']) ? (int)$body['rate_id'] : null,
                        trim((string)($body['contact_number'] ?? '')) ?: null,
                        ($body['status'] ?? 'active') === 'inactive' ? 'inactive' : 'active',
                        $id,
                    ]);
                }
                jsonResponse(['ok' => true]);
            }
            if ($method === 'DELETE') {
                $id = (int)($_GET['id'] ?? 0);
                $pdo->prepare('DELETE FROM members WHERE member_id = ?')->execute([$id]);
                jsonResponse(['ok' => true]);
            }
            break;

        case 'rates':
            requireAuth();
            if ($method === 'GET') {
                $stmt = $pdo->query('SELECT r.*, COUNT(m.member_id) AS member_count FROM rates r LEFT JOIN members m ON m.rate_id = r.rate_id GROUP BY r.rate_id ORDER BY r.rate_id');
                jsonResponse($stmt->fetchAll());
            }
            requireRoles(['admin']);
            $body = getJsonBody();
            if ($method === 'POST') {
                $stmt = $pdo->prepare('INSERT INTO rates (name, charge, description) VALUES (?, ?, ?)');
                $stmt->execute([trim((string)$body['name']), (float)$body['charge'], trim((string)($body['description'] ?? '')) ?: null]);
                jsonResponse(['rate_id' => (int)$pdo->lastInsertId()], 201);
            }
            if ($method === 'PUT') {
                $id = (int)($_GET['id'] ?? 0);
                $stmt = $pdo->prepare('UPDATE rates SET name = ?, charge = ?, description = ? WHERE rate_id = ?');
                $stmt->execute([trim((string)$body['name']), (float)$body['charge'], trim((string)($body['description'] ?? '')) ?: null, $id]);
                jsonResponse(['ok' => true]);
            }
            if ($method === 'DELETE') {
                $id = (int)($_GET['id'] ?? 0);
                $pdo->prepare('DELETE FROM rates WHERE rate_id = ?')->execute([$id]);
                jsonResponse(['ok' => true]);
            }
            break;

        case 'attendance':
            $user = requireAuth();
            if ($method === 'GET') {
                if ($user['roleType'] === 'member') {
                    $stmt = $pdo->prepare('SELECT a.*, m.fullname AS member_name FROM attendance a JOIN members m ON a.member_id = m.member_id WHERE a.member_id = ? ORDER BY a.attendance_date DESC');
                    $stmt->execute([$user['id']]);
                    jsonResponse($stmt->fetchAll());
                }
                $stmt = $pdo->query('SELECT a.*, m.fullname AS member_name FROM attendance a JOIN members m ON a.member_id = m.member_id ORDER BY a.attendance_date DESC, a.attendance_id DESC');
                jsonResponse($stmt->fetchAll());
            }
            $body = getJsonBody();
            if ($method === 'POST') {
                $targetMember = $user['roleType'] === 'member' ? $user['id'] : (int)$body['member_id'];
                $status = ($body['status'] ?? 'Present') === 'Absent' ? 'Absent' : 'Present';
                $date = substr((string)($body['attendance_date'] ?? date('Y-m-d')), 0, 10);
                $checkIn = $status === 'Present' ? date('Y-m-d H:i:s') : null;
                $stmt = $pdo->prepare('INSERT INTO attendance (member_id, attendance_date, status, check_in_time) VALUES (?, ?, ?, ?)');
                $stmt->execute([$targetMember, $date, $status, $checkIn]);
                jsonResponse(['attendance_id' => (int)$pdo->lastInsertId()], 201);
            }
            if ($method === 'PUT') {
                $id = (int)($_GET['id'] ?? 0);
                $act = $body['action'] ?? '';
                if ($act === 'check_in') {
                    $pdo->prepare("UPDATE attendance SET status = 'Present', check_in_time = NOW() WHERE attendance_id = ?")->execute([$id]);
                } elseif ($act === 'check_out') {
                    $pdo->prepare("UPDATE attendance SET status = 'Present', check_in_time = COALESCE(check_in_time, NOW()), check_out_time = NOW() WHERE attendance_id = ?")->execute([$id]);
                } else {
                    $st = ($body['status'] ?? 'Present') === 'Absent' ? 'Absent' : 'Present';
                    if ($st === 'Absent') {
                        $pdo->prepare("UPDATE attendance SET status = 'Absent', check_in_time = NULL, check_out_time = NULL WHERE attendance_id = ?")->execute([$id]);
                    } else {
                        $pdo->prepare("UPDATE attendance SET status = 'Present', check_in_time = COALESCE(check_in_time, NOW()) WHERE attendance_id = ?")->execute([$id]);
                    }
                }
                jsonResponse(['ok' => true]);
            }
            if ($method === 'DELETE') {
                requireRoles(['admin', 'staff']);
                $id = (int)($_GET['id'] ?? 0);
                $pdo->prepare('DELETE FROM attendance WHERE attendance_id = ?')->execute([$id]);
                jsonResponse(['ok' => true]);
            }
            break;

        case 'equipment':
            requireAuth();
            if ($method === 'GET') {
                $stmt = $pdo->query('SELECT e.*, m.fullname AS member_name FROM equipment e LEFT JOIN members m ON e.member_id = m.member_id ORDER BY e.equipment_id DESC');
                jsonResponse($stmt->fetchAll());
            }
            requireRoles(['admin', 'staff']);
            $body = getJsonBody();
            if ($method === 'POST') {
                $stmt = $pdo->prepare('INSERT INTO equipment (name, amount, quantity, description, member_id) VALUES (?, ?, ?, ?, ?)');
                $stmt->execute([trim((string)$body['name']), (float)$body['amount'], (int)$body['quantity'], trim((string)($body['description'] ?? '')) ?: null, !empty($body['member_id']) ? (int)$body['member_id'] : null]);
                jsonResponse(['equipment_id' => (int)$pdo->lastInsertId()], 201);
            }
            if ($method === 'PUT') {
                $id = (int)($_GET['id'] ?? 0);
                $stmt = $pdo->prepare('UPDATE equipment SET name = ?, amount = ?, quantity = ?, description = ?, member_id = ? WHERE equipment_id = ?');
                $stmt->execute([trim((string)$body['name']), (float)$body['amount'], (int)$body['quantity'], trim((string)($body['description'] ?? '')) ?: null, !empty($body['member_id']) ? (int)$body['member_id'] : null, $id]);
                jsonResponse(['ok' => true]);
            }
            if ($method === 'DELETE') {
                $id = (int)($_GET['id'] ?? 0);
                $pdo->prepare('DELETE FROM equipment WHERE equipment_id = ?')->execute([$id]);
                jsonResponse(['ok' => true]);
            }
            break;

        case 'staffs':
            $user = requireRoles(['admin', 'staff']);
            if ($method === 'GET') {
                $stmt = $pdo->query('SELECT s.staff_id, s.username, s.email, s.admin_id, s.role, a.name AS admin_name FROM staffs s LEFT JOIN admin a ON s.admin_id = a.user_id ORDER BY s.staff_id');
                jsonResponse($stmt->fetchAll());
            }
            requireRoles(['admin']);
            $body = getJsonBody();
            if ($method === 'POST') {
                $hash = password_hash((string)$body['password'], PASSWORD_DEFAULT);
                $stmt = $pdo->prepare('INSERT INTO staffs (username, password, email, admin_id, role) VALUES (?, ?, ?, ?, ?)');
                $stmt->execute([trim((string)$body['username']), $hash, trim((string)$body['email']), !empty($body['admin_id']) ? (int)$body['admin_id'] : $user['id'], trim((string)($body['role'] ?? 'staff'))]);
                jsonResponse(['staff_id' => (int)$pdo->lastInsertId()], 201);
            }
            if ($method === 'PUT') {
                $id = (int)($_GET['id'] ?? 0);
                if (!empty($body['password'])) {
                    $hash = password_hash((string)$body['password'], PASSWORD_DEFAULT);
                    $stmt = $pdo->prepare('UPDATE staffs SET username = ?, password = ?, email = ?, role = ?, admin_id = ? WHERE staff_id = ?');
                    $stmt->execute([trim((string)$body['username']), $hash, trim((string)$body['email']), trim((string)($body['role'] ?? 'staff')), !empty($body['admin_id']) ? (int)$body['admin_id'] : null, $id]);
                } else {
                    $stmt = $pdo->prepare('UPDATE staffs SET username = ?, email = ?, role = ?, admin_id = ? WHERE staff_id = ?');
                    $stmt->execute([trim((string)$body['username']), trim((string)$body['email']), trim((string)($body['role'] ?? 'staff')), !empty($body['admin_id']) ? (int)$body['admin_id'] : null, $id]);
                }
                jsonResponse(['ok' => true]);
            }
            if ($method === 'DELETE') {
                $id = (int)($_GET['id'] ?? 0);
                $pdo->prepare('DELETE FROM staffs WHERE staff_id = ?')->execute([$id]);
                jsonResponse(['ok' => true]);
            }
            break;

        case 'transactions':
            $user = requireAuth();
            if ($method === 'GET') {
                if ($user['roleType'] === 'member') {
                    $stmt = $pdo->prepare('SELECT t.*, m.fullname AS member_name, s.username AS staff_username FROM transactions t JOIN members m ON t.member_id = m.member_id LEFT JOIN staffs s ON t.staff_id = s.staff_id WHERE t.member_id = ? ORDER BY t.transaction_id DESC');
                    $stmt->execute([$user['id']]);
                    jsonResponse($stmt->fetchAll());
                }
                $stmt = $pdo->query('SELECT t.*, m.fullname AS member_name, s.username AS staff_username FROM transactions t JOIN members m ON t.member_id = m.member_id LEFT JOIN staffs s ON t.staff_id = s.staff_id ORDER BY t.transaction_id DESC');
                jsonResponse($stmt->fetchAll());
            }
            if ($method === 'POST') {
                requireRoles(['admin', 'staff']);
                $body = getJsonBody();
                $stmt = $pdo->prepare('INSERT INTO transactions (member_id, staff_id, amount, description) VALUES (?, ?, ?, ?)');
                $stmt->execute([(int)$body['member_id'], !empty($body['staff_id']) ? (int)$body['staff_id'] : null, (float)$body['amount'], trim((string)($body['description'] ?? '')) ?: null]);
                jsonResponse(['transaction_id' => (int)$pdo->lastInsertId()], 201);
            }
            if ($method === 'DELETE') {
                requireRoles(['admin']);
                $id = (int)($_GET['id'] ?? 0);
                $pdo->prepare('DELETE FROM transactions WHERE transaction_id = ?')->execute([$id]);
                jsonResponse(['ok' => true]);
            }
            break;

        case 'announcements':
            requireAuth();
            if ($method === 'GET') {
                jsonResponse($pdo->query('SELECT * FROM announcements ORDER BY announcement_date DESC, announcement_id DESC')->fetchAll());
            }
            requireRoles(['admin', 'staff']);
            $body = getJsonBody();
            if ($method === 'POST') {
                $stmt = $pdo->prepare('INSERT INTO announcements (message, announcement_date) VALUES (?, ?)');
                $stmt->execute([trim((string)$body['message']), substr((string)($body['announcement_date'] ?? date('Y-m-d')), 0, 10)]);
                jsonResponse(['announcement_id' => (int)$pdo->lastInsertId()], 201);
            }
            if ($method === 'DELETE') {
                $id = (int)($_GET['id'] ?? 0);
                $pdo->prepare('DELETE FROM announcements WHERE announcement_id = ?')->execute([$id]);
                jsonResponse(['ok' => true]);
            }
            break;

        case 'reminders':
            $user = requireAuth();
            if ($method === 'GET') {
                if ($user['roleType'] === 'member') {
                    $stmt = $pdo->prepare('SELECT r.*, m.fullname AS member_name FROM reminder r LEFT JOIN members m ON r.member_id = m.member_id WHERE r.member_id = ? ORDER BY r.reminder_date DESC');
                    $stmt->execute([$user['id']]);
                    jsonResponse($stmt->fetchAll());
                }
                jsonResponse($pdo->query('SELECT r.*, m.fullname AS member_name FROM reminder r LEFT JOIN members m ON r.member_id = m.member_id ORDER BY r.reminder_date DESC')->fetchAll());
            }
            requireRoles(['admin', 'staff']);
            $body = getJsonBody();
            if ($method === 'POST') {
                $stmt = $pdo->prepare('INSERT INTO reminder (name, message, status, reminder_date, reminder_time, member_id) VALUES (?, ?, ?, ?, ?, ?)');
                $stmt->execute([
                    trim((string)$body['name']),
                    trim((string)($body['message'] ?? '')) ?: null,
                    $body['status'] ?? 'Pending',
                    substr((string)($body['reminder_date'] ?? date('Y-m-d')), 0, 10),
                    !empty($body['reminder_time']) ? $body['reminder_time'] : null,
                    !empty($body['member_id']) ? (int)$body['member_id'] : null,
                ]);
                jsonResponse(['reminder_id' => (int)$pdo->lastInsertId()], 201);
            }
            if ($method === 'PUT') {
                $id = (int)($_GET['id'] ?? 0);
                $pdo->prepare('UPDATE reminder SET status = ? WHERE reminder_id = ?')->execute([$body['status'] ?? 'Sent', $id]);
                jsonResponse(['ok' => true]);
            }
            if ($method === 'DELETE') {
                $id = (int)($_GET['id'] ?? 0);
                $pdo->prepare('DELETE FROM reminder WHERE reminder_id = ?')->execute([$id]);
                jsonResponse(['ok' => true]);
            }
            break;

        case 'classes':
            $user = requireAuth();
            if ($method === 'GET') {
                $uid = (int)$user['id'];
                $sql = "SELECT c.*, s.username AS trainer_username,
                        (SELECT COUNT(*) FROM class_bookings cb WHERE cb.class_id = c.class_id) AS booked_count,
                        (SELECT COUNT(*) FROM class_bookings cb2 WHERE cb2.class_id = c.class_id AND cb2.member_id = ?) AS is_booked
                        FROM classes c LEFT JOIN staffs s ON c.staff_id = s.staff_id ORDER BY c.class_id";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$user['roleType'] === 'member' ? $uid : 0]);
                jsonResponse($stmt->fetchAll());
            }
            requireRoles(['admin', 'staff']);
            $body = getJsonBody();
            if ($method === 'POST') {
                $stmt = $pdo->prepare('INSERT INTO classes (title, category, staff_id, schedule_day, schedule_time, room, capacity) VALUES (?, ?, ?, ?, ?, ?, ?)');
                $stmt->execute([
                    trim((string)$body['title']),
                    trim((string)($body['category'] ?? 'Fitness')),
                    !empty($body['staff_id']) ? (int)$body['staff_id'] : null,
                    trim((string)$body['schedule_day']),
                    trim((string)$body['schedule_time']),
                    trim((string)($body['room'] ?? 'Main Studio')),
                    max(1, (int)($body['capacity'] ?? 15)),
                ]);
                jsonResponse(['class_id' => (int)$pdo->lastInsertId()], 201);
            }
            if ($method === 'DELETE') {
                $id = (int)($_GET['id'] ?? 0);
                $pdo->prepare('DELETE FROM classes WHERE class_id = ?')->execute([$id]);
                jsonResponse(['ok' => true]);
            }
            break;

        case 'class_book':
            $user = requireAuth();
            if ($method !== 'POST') jsonResponse(['error' => 'Method not allowed'], 405);
            $body = getJsonBody();
            $classId = (int)($body['class_id'] ?? 0);
            $memberId = $user['roleType'] === 'member' ? (int)$user['id'] : (int)($body['member_id'] ?? 0);
            $mode = $body['mode'] ?? 'book';
            if ($mode === 'cancel') {
                $pdo->prepare('DELETE FROM class_bookings WHERE class_id = ? AND member_id = ?')->execute([$classId, $memberId]);
                jsonResponse(['ok' => true]);
            }
            $pdo->prepare('INSERT INTO class_bookings (class_id, member_id) VALUES (?, ?)')->execute([$classId, $memberId]);
            jsonResponse(['ok' => true], 201);
            break;

        case 'assessments':
            $user = requireAuth();
            if ($method === 'GET') {
                if ($user['roleType'] === 'member') {
                    $stmt = $pdo->prepare('SELECT fa.*, m.fullname AS member_name FROM fitness_assessments fa JOIN members m ON fa.member_id = m.member_id WHERE fa.member_id = ? ORDER BY fa.recorded_date DESC, fa.assessment_id DESC');
                    $stmt->execute([$user['id']]);
                    jsonResponse($stmt->fetchAll());
                }
                jsonResponse($pdo->query('SELECT fa.*, m.fullname AS member_name FROM fitness_assessments fa JOIN members m ON fa.member_id = m.member_id ORDER BY fa.recorded_date DESC, fa.assessment_id DESC')->fetchAll());
            }
            $body = getJsonBody();
            if ($method === 'POST') {
                $memberId = $user['roleType'] === 'member' ? (int)$user['id'] : (int)$body['member_id'];
                $w = (float)$body['weight_kg'];
                $h = (float)$body['height_cm'];
                if ($w <= 0 || $h <= 0) jsonResponse(['error' => 'Weight and height must be positive'], 400);
                $bmi = round($w / (($h / 100) * ($h / 100)), 1);
                $stmt = $pdo->prepare('INSERT INTO fitness_assessments (member_id, weight_kg, height_cm, bmi, body_fat_pct, notes, recorded_date) VALUES (?, ?, ?, ?, ?, ?, ?)');
                $stmt->execute([
                    $memberId,
                    $w,
                    $h,
                    $bmi,
                    isset($body['body_fat_pct']) && $body['body_fat_pct'] !== '' ? (float)$body['body_fat_pct'] : null,
                    trim((string)($body['notes'] ?? '')) ?: null,
                    substr((string)($body['recorded_date'] ?? date('Y-m-d')), 0, 10),
                ]);
                jsonResponse(['assessment_id' => (int)$pdo->lastInsertId(), 'bmi' => $bmi], 201);
            }
            if ($method === 'DELETE') {
                requireRoles(['admin', 'staff']);
                $id = (int)($_GET['id'] ?? 0);
                $pdo->prepare('DELETE FROM fitness_assessments WHERE assessment_id = ?')->execute([$id]);
                jsonResponse(['ok' => true]);
            }
            break;

        default:
            jsonResponse(['error' => 'Unknown API action'], 404);
    }
} catch (PDOException $e) {
    $msg = $e->getCode() === '23000' ? 'Duplicate or constraint violation' : 'Database error: ' . $e->getMessage();
    jsonResponse(['error' => $msg], $e->getCode() === '23000' ? 409 : 500);
}
