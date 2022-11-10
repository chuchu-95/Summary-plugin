
main();

function main(){
    websql.initDataOfDB(
        function(){
            console.log("---------inithelper----------");

            /* temp and cur */
            // sort historyItem and already has visit_num
            websql.db.transaction(
                function(tx){
                    var selectSql = 
                        "(SELECT domain, sum(visit_num) AS num FROM urls GROUP BY domain)";
                    tx.executeSql(
                        //"SELECT host, visit_num FROM urls ORDER BY visit_num DESC",
                        'SELECT domain AS name, num AS value FROM' + selectSql + 
                        'WHERE name is not null ORDER BY value DESC',
                        null,
                        function(tx, rs){
                            // console.log(rs);
                            var rows = rs.rows;
                            var rsNum = rows.length;
                            // alert(typeof(rows));
                            // console.log(rsNum);
                            // show in html
                            $(function(){
                                var temp1 = '<p>Total ' + rsNum + ' visited domains</p>';
                                $("#total-domains").append(temp1);
                            })

                            // click button and show res
                            $("#search-btn").click(function(){
                                $("tbody").children().remove()
                                var searchNum = Number($("#search-num").val());
                                if(searchNum > rsNum){
                                    alert("Please input a lower search number!");
                                }else{
                                    // alert(typeof(searchNum));
                                    var cnt = 0;
                                    var i = 0;
                                    while(cnt < searchNum){
                                        var domain = rows[i].name;
                                        var num = rows[i].value;
                                        // alert("brfore:"+i);
                                        if(domain != null){
                                            // add to html
                                            var $temp2 = $('<tr id="urls"><td>'+ domain +'</td>'+'<td>'+ num +'</td></tr>');
                                            
                                            $("tbody").append($temp2);
                                            cnt ++;
                                        }
                                        i ++;
                                    }
                                }
                            })
                            
                            drawCloud(rows);
                        },
                        websql.callError
                    )
                }
            );
        }
    );
}




