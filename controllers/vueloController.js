const database = require('../config/database');
const sequelize = require('sequelize');
const Vuelo = require('../models/Vuelo');

const controller = {};

controller.getVuelos = async function (callback){
    try {
        let vuelos = await Vuelo.findAll({
            where: {
                Activo: 1
            }
        });

        vuelos = vuelos.map(result => result.dataValues);
        console.log(vuelos)
        callback(vuelos, null);
    }catch (error) {
        callback(null, error);
    }
}

controller.getOfertasVuelos = async function (data, callback){
    try{

        let ofertasVuelos = await database.query(
            "SELECT `Vuelo`.`IdVuelo`, `Vuelo`.`HoraSalida`, `Vuelo`.`HoraLlegada`, `Ruta`.`Origen`, `Ruta`.`Destino`, `Vuelo`.`FechaSalida`, `Vuelo`.`FechaLlegada` FROM `Vuelo`" +
            " INNER JOIN `Ruta` ON `Ruta`.`IdRuta` = `Vuelo`.`IdRuta`" +
            " WHERE `Ruta`.`Origen` = '"+data.Origen+"' AND `Ruta`.`Destino` = '"+data.Destino+"'" +
            " AND `Vuelo`.`FechaSalida` = '"+data.FechaSalida+"' AND `Vuelo`.`EstatusVuelo` = 'A tiempo'" +
            " AND `Vuelo`.`Activo` = 1;",
            { type: sequelize.QueryTypes.SELECT }
        );
        callback(ofertasVuelos, null);

    }catch(error){
        callback(null, error);
    }
}

controller.getEscalas1 = async function (data, callback){
    try{
        
        let escalas1 = await database.query(
            "SELECT `Vuelo`.`IdVuelo`, `Vuelo`.`HoraSalida`, `Vuelo`.`HoraLlegada`, `Ruta`.`Origen`, `Ruta`.`Destino`," + 
            " `Vuelo`.`FechaSalida`, `Vuelo`.`FechaLlegada` FROM `Vuelo`" +
            " INNER JOIN `Ruta` ON `Ruta`.`IdRuta` = `Vuelo`.`IdRuta`" +
            " WHERE `Ruta`.`Origen` = '"+data.Origen+"'" +
            " AND `Vuelo`.`FechaSalida` = '"+data.FechaSalida+"'" +
            " AND `Vuelo`.`EstatusVuelo` = 'A tiempo'" +
            " AND `Vuelo`.`Activo` = 1;",
            { type: sequelize.QueryTypes.SELECT }
        );
        console.log(escalas1)
        callback(escalas1, null);

    }catch(error){
        callback(null, error);
    }
}

controller.getEscalas2 = async function (escalas1, data, callback){
    //Defino el array donde voy a guardar todas las escalas, en este caso es un arrays de arrays
    var escalas = new Array(escalas1.length); 
    let escalas2;
    var cont;
    var aux;

    // Defino el vector en donde se guardar??n los origenes evaluados
    var origenesEvaluados = [];
    // Contador utilizado para saber si el origen que estoy evaluando en un instante dado ya fue utilizado
    var cont2;
    //Aqu?? guardar?? la posici??n del vector escalas2 donde se encuentra el vuelo que estoy evaluando en ese momento
    var posicion;

    for (let i = 0; i < escalas1.length; i++) {
        
        //Aqu?? estoy guardando el Destino del vuelo de escalas1 como Origen de data.Origen
        //Igual con la fecha de llegada
        //Esto se hace porque en el query necesito evaluar que la Ruta.Origen del vuelo que estoy buscando
        //sea igual al Destino del vuelo que tengo en escalas1 
        data.Origen = escalas1[i].Destino
        data.FechaLlegada = escalas1[i].FechaLlegada

        //Guardo el primer origen en el arreglo de origenes evaluados
        //Este origen fue el que ingres?? el usuario la primera vez
        //Esto se hace para que las escalas no se conviertan en un ciclo y volvamos al mismo sitio donde partimos
        //Teniendo este origen guardado, lo podr?? tomar en cuenta cuando haga la seleci??n de los vuelos
        //que ser??n guardados en las escalas
        origenesEvaluados.push(escalas1[i].Origen);
    
        aux = [];
        
        aux.push(escalas1[i])
        cont = 0;
        do{
            try{
                escalas2 = await database.query(
                    "SELECT `Vuelo`.`IdVuelo`, `Vuelo`.`HoraSalida`, `Vuelo`.`HoraLlegada`, `Ruta`.`Origen`," +
                    " `Ruta`.`Destino` AS Destino, `Vuelo`.`FechaSalida`, `Vuelo`.`FechaLlegada` FROM `Vuelo`" +
                    " INNER JOIN `Ruta` ON `Ruta`.`IdRuta` = `Vuelo`.`IdRuta`" +
                    " WHERE `Ruta`.`Origen` = '"+data.Origen+"'" +
                    " AND YEAR(`Vuelo`.`FechaSalida`) >= YEAR('"+data.FechaLlegada+"')" +
                    " AND MONTH(`Vuelo`.`FechaSalida`) >= MONTH('"+data.FechaLlegada+"')" +
                    " AND DAY(`Vuelo`.`FechaSalida`) >= DAY('"+data.FechaLlegada+"')" +
                    " AND `Vuelo`.`EstatusVuelo` = 'A tiempo'" +
                    " AND `Vuelo`.`Activo` = 1" +
                    " ORDER BY `Vuelo`.`FechaSalida` ASC",
                    { type: sequelize.QueryTypes.SELECT }
                );
                
                cont++;
                cont2 = 0;

                //S??lo se guardar??n vuelos en el arreglo auxiliar si el query trae algo
                if(escalas2.length >0 ){
                    //Aqu?? digo que le estoy asignando a data.Origen y data.FechaLlegada lo que se encuentra en 
                    //escalas2 en la posici??n 0
                    //Esto debido a que en la posici??n 0 me trae el vuelo con la fecha m??s proxima
                    data.Origen = escalas2[0].Destino
                    data.FechaLlegada = escalas2[0].FechaLlegada
                    posicion = 0;
                   
                    for (let k = 0; k < escalas2.length; k++) {
                        if(escalas2[k].Destino == data.Destino){
                            //Aqu?? voy a reescribir lo que guard?? en las l??neas de arriba si se cumple
                            //la condici??n de que haya un vuelo con el destino igual al ingresado
                            //Con esto le estoy dando prioridad a dicho vuelo 
                            data.Origen = escalas2[k].Destino
                            data.FechaLlegada = escalas2[k].FechaLlegada
                            posicion = k;
                            break; //Si encontr?? dicho vuelo, hago un break para salirme del for
                                   //As?? no seguir?? buscando porque ya encontr?? un vuelo con dicho destino
                        }
                    }

                    //Hago push sobre el vector que tendr?? los origenes evaluados
                    //A medida que el query me trae los vuelos, yo voy guardando los origenes de esos vuelos
                    origenesEvaluados.push(escalas2[posicion].Origen);
                    
                    //Aqu?? itero sobre el arreglo de origenes evaluados
                    for (let j = 0; j < origenesEvaluados.length; j++) {
                        //Verifico si el destino del vuelo que ya seleccion?? ya es alg??n origen que he evaluado
                        if(origenesEvaluados[j] == escalas2[posicion].Destino){
                            //Si es as??, le sumo uno al contador
                            cont2++;
                        }
                    }
                    //Si el contador es igual a cero, significa que el destino del vuelo seleccionado no es
                    //ning??n origen que ya he evaluado, por lo tanto lo puedo guardar en el arreglo auxiliar 
                    //que contiene las escalas
                    if(cont2 == 0){
                        aux.push(escalas2[posicion])
                    }
                }else{
                    //Si el query no trae nada, voy a reestructurar el areeglo escalas2 para que contenga
                    //una posici??n valida y un arreglo con un destino valido.
                    //De esta manera no me dar?? error cuando eval??e en el while
                    posicion = 0;
                    escalas2 = [[{Destino: ''}]]
                }   
            }catch(error){
                callback(null, error);
            }
        }while(data.Destino != escalas2[posicion].Destino && cont <= 3);   
        //Una vez me salgo del while, guardo en la posici??n i del arreglo escalas el arreglo aux
        escalas[i] = aux;

        //Seteo el vector de origenes evaluados ya que necesito evaluar otros origenes dependiendo de cada
        //iteraci??n del for
        origenesEvaluados = [];
    }
    
    callback(escalas, null)
}

controller.getVueloUpdate = async function (IdVuelo, callback){
    try {
        let vueloUpdate = await Vuelo.findOne({
            where: {
                IdVuelo
            }
        });

        callback(vueloUpdate, null);
    }catch (error) {
        callback(null, error);
    }
}

controller.deleteVuelo = async function (IdVuelo, callback) {
    try {
        let response = await Vuelo.update({
            Activo: 0
        }, {
            where: {
                IdVuelo
            }
        });
        callback(null);
    } catch (error) {
        callback(error);
    }
}

controller.createVuelo = async function (data, callback) {
    
    try {
        let response = await Vuelo.create({
            EstatusVuelo: data.EstatusVuelo,
            FechaSalida: data.FechaSalida,
            FechaLlegada: data.FechaLlegada,
            HoraSalida: data.HoraSalida,
            HoraLlegada: data.HoraLlegada,
            Destino: data.Destino,
            IdAvion: data.IdAvion,
            IdRuta: data.IdRuta
        });
        
        callback(null);
    } catch (error) {
        callback(error);
    }
}

controller.updateVuelo = async function (data, IdVuelo, callback) {
    try {
        let response = await Vuelo.update({
            EstatusVuelo: data.EstatusVuelo,
            FechaSalida: data.FechaSalida,
            FechaLlegada: data.FechaLlegada,
            HoraSalida: data.HoraSalida,
            HoraLlegada: data.HoraLlegada,
            Destino: data.Destino,
            IdAvion: data.IdAvion,
            IdRuta: data.IdRuta
        },{
            where:{
                IdVuelo
            } 
        });
        
        callback(null);
    } catch (error) {
        callback(error);
    }
}

//Busca los vuelos charter, considerando que en los vuelos charter, los aviones asignados, son alquilados 
controller.getVuelosCharter = async function (callback) {
    try {

        let vuelosCharter = await database.query(
            "SELECT V.`IdVuelo`, R.`Origen`, V.`Destino`, V.`FechaSalida`, V.`FechaLlegada`, V.`EstatusVuelo`, V.`HoraSalida`, V.`HoraLlegada`, V.`IdAvion`" +
            " FROM `Vuelo` AS V" +
            " INNER JOIN `Alquiler_Avion` AS AA ON AA.`IdAvion` = V.`IdAvion`" +
            " INNER JOIN `Ruta` AS R ON R.`IdRuta` = V.`IdRuta`" +
            " WHERE V.`Activo` = 1;",
            {type: sequelize.QueryTypes.SELECT}
        );
        console.log(vuelosCharter)
        callback(vuelosCharter, null)

    } catch (error) {
        callback(null, error)
    }
}


// Considera a un vuelo en sobreventa si hay sobreventa en cualquiera de las clases
controller.reportarSobreventas = async function (callback) {
    try {
        let sobreventas = await database.query(
            
            "SELECT COUNT(V.`IdVuelo`) AS numSobreventas, ROUND(COUNT(V.`IdVuelo`)/(SELECT COUNT(`IdVuelo`) FROM `Vuelo`)*100,2) AS porcSobreventas FROM `Vuelo` V" +
            " WHERE V.`IdVuelo` IN (SELECT V.`IdVuelo` FROM `Vuelo` V INNER JOIN `Pasaje` P ON P.`IdVueloReservado` = V.`IdVuelo`" +
                " INNER JOIN `Avion` A ON V.`IdAvion` = A.`IdAvion`" +
                " INNER JOIN `Modelo` M ON A.`IdModelo` = M.`IdModelo`" +
                " INNER JOIN `Tarifa` T ON P.`IdTarifa` = T.`IdTarifa`" +
                " WHERE T.`Clase` = 'ClaseEconomica'" +
                " GROUP BY V.`IdVuelo`, M.`NumAsienEco`" +
                " HAVING COUNT(P.`IdPasaje`) > M.`NumAsienEco`)"+
                " OR V.`IdVuelo` IN (SELECT V.`IdVuelo` FROM `Vuelo` V INNER JOIN `Pasaje` P ON P.`IdVueloReservado` = V.`IdVuelo`" +
                " INNER JOIN `Avion` A ON V.`IdAvion` = A.`IdAvion`" +
                " INNER JOIN `Modelo` M ON A.`IdModelo` = M.`IdModelo`" +
                " INNER JOIN `Tarifa` T ON P.`IdTarifa` = T.`IdTarifa`" +
                " WHERE T.`Clase` = 'PrimeraClase'" +
                " GROUP BY V.`IdVuelo`, M.`NumAsienPrim`" +
                " HAVING COUNT(P.`IdPasaje`) > M.`NumAsienPrim`)",
            { type: sequelize.QueryTypes.SELECT }
        );
        console.log(sobreventas);
        callback(sobreventas, null);
    } catch (error) {
        callback(null,error);
    }
}

module.exports = controller;