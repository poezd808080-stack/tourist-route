<?php

require_once "db.php";

header("Content-Type: application/json; charset=UTF-8");


if (!isset($_GET["country_id"])) {

    echo json_encode([]);

    exit;
}


$countryId = intval($_GET["country_id"]);


$stmt = $conn->prepare(
    "SELECT id, name
     FROM cities
     WHERE country_id = ?
     ORDER BY name"
);


$stmt->bind_param("i", $countryId);

$stmt->execute();


$result = $stmt->get_result();


$cities = [];


while ($row = $result->fetch_assoc()) {

    $cities[] = $row;
}


echo json_encode(
    $cities,
    JSON_UNESCAPED_UNICODE
);


$stmt->close();

$conn->close();

?>