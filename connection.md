get/connect
{
    game_id:<id>
}
:ws/connect/:id

### Move
{
    c:<w/b>
    was:<field>
    to:<field>
}

### Take
{
    c:<w/b>
    take:<field>
}

### Response
{
    status:<success/fail>
    c?:<w/b>
    field:<position>
}