<?php

require_once "db.php";

header("Content-Type: application/json; charset=UTF-8");


$sql = "SELECT id, name FROM countries ORDER BY name";

$result = $conn->query($sql);


$countries = [];


while ($row = $result->fetch_assoc()) {

    $countries[] = $row;
}


echo json_encode(
    $countries,
    JSON_UNESCAPED_UNICODE
);


$conn->close();

?>