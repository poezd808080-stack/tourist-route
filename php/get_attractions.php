<?php

require_once "db.php";

header("Content-Type: application/json; charset=UTF-8");

if (!isset($_GET["city_id"])) {
    echo json_encode([]);
    exit;
}

$cityId = intval($_GET["city_id"]);

$stmt = $conn->prepare(
    "SELECT id, name, description, visit_time, image
     FROM attractions
     WHERE city_id = ?
     ORDER BY id"
);

$stmt->bind_param("i", $cityId);
$stmt->execute();

$result = $stmt->get_result();

$attractions = [];

while ($row = $result->fetch_assoc()) {
    $row["image"] = trim($row["image"]);
    $attractions[] = $row;
}

echo json_encode(
    $attractions,
    JSON_UNESCAPED_UNICODE
);

$stmt->close();
$conn->close();

?>