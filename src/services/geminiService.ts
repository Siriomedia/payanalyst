import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, Payslip, HistoricalAnalysisResult } from "../types.ts";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("VITE_GEMINI_API_KEY non trovata. Variabili disponibili:", import.meta.env);
  throw new Error("VITE_GEMINI_API_KEY non configurata correttamente nel file .env");
}

console.log("Gemini API Key caricata:", apiKey.substring(0, 10) + "...");

const ai = new GoogleGenAI({ apiKey });

const MUNICIPAL_TAX_TABLES_TEXT = `
Diffusione Limitata
Elenco aggiornato al 12 febbraio 2025
Codice catastale,Comune,Provincia,Aliquota unica,Aliquota1,Aliquota2,Aliquota3,Aliquota4,Aliquota5,Aliquota6,Aliquota7,Aliquota8,Aliquota9,Aliquota 10,Aliquota11,Aliquota12,Esenzione,Casi specifici
A001,ABANO TERME,PD,0.8,,,,,,,,,,,12.000,00,
A004,ABBADIA CERRETO,LO,0.7,,,,,,,,,,,10.000,00,
A005,ABBADIA LARIANA,LC,,0.75,0.76,0.77,0.8,,,,,,,,,15.000,00,
A006,ABBADIA SAN SALVATORE,SI,0.6,,,,,,,,,,,12.000,00,
A007,ABBASANTA,OR,0.25,,,,,,,,,,,15.000.00,
A008,ABBATEGGIO,PE,0.5,,,,,,,,,,,,,,
A010,ABBIATEGRASSO,MI,0.8,,,,,,,,,,,13.000,00,
A013,ABRIOLA,PZ,0,,,,,,,,,,,,,,
A014,ACATE,RG,0.8,,,,,,,,,,,,,,
A015,ACCADIA,FG,0.8,,,,,,,,,,,,,,
A016,ACCEGLIO,CN,0,,,,,,,,,,,,,,
A017,ACCETTURA,MT,0.7,,,,,,,,,,,,,,
A018,ACCIANO,AQ,0.2,,,,,,,,,,,,,,
A019,ACCUMOLI,RI,0.5,,,,,,,,,,,,,,
A020,ACERENZA,PZ,0.8,,,,,,,,,,,,,,
A022,CERMES,BZ,0*,,,,,,,,,,,,,,
A023,ACERNO,SA,0.8,,,,,,,,,,,,,,
A024,ACERRA,NA,0.8,,,,,,,,,,,7.500,00,NOTA
A025,ACI BONACCORSI,CT,0.7,,,,,,,,,,,7.500,00,
A026,ACI CASTELLO,CT,0.8,,,,,,,,,,,,,,
A027,ACI CATENA,CT,0.8,,,,,,,,,,,,,,
A028,ACIREALE,CT,0.8,,,,,,,,,,,,,,
A029,ACI SANT'ANTONIO,CT,0.8,,,,,,,,,,,,,,
A032,ACQUAFONDATA,FR,0.5,,,,,,,,,,,9.999.99,
A033,ACQUAFORMOSA,CS,0.8,,,,,,,,,,,,,,
A034,ACQUAFREDDA,BS,,0.38,0.4,0.45,0.47,,,,,,,,,
A035,ACQUALAGNA,PU,0.8,,,,,,,,,,,,,,
A038,ACQUANEGRA SUL CHIESE,MN,,0.55,0.68,0.72,0.8,,,,,,,,,10.000,00,
A039,ACQUANEGRA CREMONESE,CR,0.8,,,,,,,,,,,,,,
A040,ACQUAPENDENTE,VT,0.7,,,,,,,,,,,,,,
A041,ACQUAPPESA,CS,0.8,,,,,,,,,,,,,,
A043,ACQUARO,W,0.8,,,,,,,,,,,,,,
A044,ACQUASANTA TERME,AP,0.8,,,,,,,,,,,,,,
A045,ACQUASPARTA,TR,0.8,,,,,,,,,,,,,,
A047,ACQUAVIVA PICENA,AP,0.8,,,,,,,,,,,,,,
A048,ACQUAVIVA DELLE FONTI,BA,,0.4,0.6,0.8,,,,,,,,,,9.000,00,
A049,ACQUAVIVA PLATANI,CL,0*,,,,,,,,,,,,,,
A050,ACQUAVIVA COLLECROCE,CB,0.2,,,,,,,,,,,,,,
A051,ACQUAVIVA D'ISERNIA,IS,0*,,,,,,,,,,,,,,
A052,ACQUI TERME,AL,0.8,,,,,,,,,,,,,,
A053,ACRI,CS,0.8,,,,,,,,,,,,,,
A054,ACUTO,FR,0.8,,,,,,,,,,,13.000.00,
A055,ADELFIA,BA,0.7,,,,,,,,,,,,,,
A056,ADRANO,CT,0.8,,,,,,,,,,,,,,
A057,ADRARA SAN MARTINO,BG,0.8,,,,,,,,,,,15.000,00,
A058,ADRARA SAN ROCCO,BG,0.8,,,,,,,,,,,,,,
A059,ADRIA,RO,0.8,,,,,,,,,,,9.999,99,
A060,ADRO,BS,0.5,,,,,,,,,,,10.000,00,
A061,AFFI,VR,,0.3,0.5,0.8,,,,,,,,,,
A062,AFFILE,RM,0.8,,,,,,,,,,,,,,
A064,AFRAGOLA,NA,0.8,,,,,,,,,,,7.999,99,
A065,AFRICO,RC,0.8,,,,,,,,,,,10.000.00,
A067,AGAZZANO,PC,0.8,,,,,,,,,,,9.000,00,
A068,AGEROLA,NA,0.7,,,,,,,,,,,15.000,00,
A069,AGGIUS,SS,0.2,,,,,,,,,,,,,,
A070,AGIRA,EN,0.8,,,,,,,,,,,,,,
A071,AGLIANA,PT,0.8,,,,,,,,,,,,,,
A072,AGLIANO TERME,AT,0.7,,,,,,,,,,,,,,
A074,AGLIE,TO,0.8,,,,,,,,,,,13.499.99,
A075,AGNA,PD,0.78,,,,,,,,,,,,,,
A076,AGNADELLO,CR,0.7,,,,,,,,,,,,,,
A077,AGNANA CALABRA,RC,0.8,,,,,,,,,,,,,,
A080,AGNONE,IS,0.6,,,,,,,,,,,,,,
A081,VILLA LATINA,FR,0.8,,,,,,,,,,,,,,
A082,AGNOSINE,BS,0.5,,,,,,,,,,,,,,
A083,AGORDO,BL,,0.63,0.76,0.79,0.8,,,,,,,,,10.000,00,
A084,AGOSTA,RM,0.6,,,,,,,,,,,16.000,00,
A085,AGRA,VA,0.3,,,,,,,,,,,15.000.00,
A087,AGRATE BRIANZA,MB,0.8,,,,,,,,,,,15.000,00,
A088,AGRATE CONTURBIA,NO,,0.4,0.65,0.8,0.8,,,,,,,,,10.000,00,
A089,AGRIGENTO,AG,0.8,,,,,,,,,,,7.499,99,
A091,AGROPOLI,SA,0.8,,,,,,,,,,,7.500.00,
A092,AGUGLIANO,AN,0.8,,,,,,,,,,,,,,
A093,AGUGLIARO,VI,,0.5,0.55,0.6,,,,,,,,,,,10.000,00,
A094,AYAS,AO,0*,,,,,,,,,,,,,,
A096,AICURZIO,MB,0.8,,,,,,,,,,,,,,
A097,AIDOMAGGIORE,OR,0*,,,,,,,,,,,,,,
A098,AIDONE,EN,0.8,,,,,,,,,,,,,,
A100,AIELLI,AQ,0.2,,,,,,,,,,,,,,
A101,AIELLO DEL SABATO,AV,0.8,,,,,,,,,,,,,,
A102,AIELLO CALABRO,CS,0.5,,,,,,,,,,,,,,
A103,AIELLO DEL FRIULI,UD,,0.2,0.35,0.45,0.65,,,,,,,,,15.000,00,
A105,AIETA,CS,,0.4,0.6,0.65,0.8,,,,,,,,,9.500,00,
A106,AILANO,CE,0.8,,,,,,,,,,,,,,
A107,AILOCHE,BI,0.6,,,,,,,,,,,,,,
A108,AYMAVILLES,AO,0.15,,,,,,,,,,,18.000,00,
A109,AIRASCA,TO,0.6,,,,,,,,,,,10.000,00,
A110,AIROLA,BN,0.8,,,,,,,,,,,,,,
A111,AIROLE,IM,0.8,,,,,,,,,,,10.000,00,
A112,AIRUNO,LC,,0.33,0.35,0.8,,,,,,,,,,,
A113,AISONE,CN,0,,,,,,,,,,,,,,
A115,ALA' DEI SARDI,SS,0*,,,,,,,,,,,,,,
A116,ALA,TN,0,,,,,,,,,,,,,,
A117,ALA DI STURA,TO,0*,,,,,,,,,,,,,,
A118,ALAGNA,PV,0.65,,,,,,,,,,,,,,
A119,ALAGNA VALSESIA,VC,0.3,,,,,,,,,,,,,,
A120,ALANNO,PE,0.8,,,,,,,,,,,,,,
A122,ALASSIO,SV,0.8,,,,,,,,,,,12.000.00,
A123,ALATRI,FR,0.8,,,,,,,,,,,15.000,00,
A124,ALBA,CN,,0.4,0.45,0.5,0.6,,,,,,,,,8.500,00,
A125,ALBA ADRIATICA,TE,0.8,,,,,,,,,,,8.000.00,
A126,ALBAGIARA,OR,0*,,,,,,,,,,,,,,
A127,ALBAIRATE,MI,0.8,,,,,,,,,,,10.000,00,
A128,ALBANELLA,SA,0.8,,,,,,,,,,,9.999,99,
A129,ALBANO SANT'ALESSANDRO,BG,,0.65,0.73,0.78,0.8,,,,,,,,,8.000,00,
A130,ALBANO VERCELLESE,VC,0.5,,,,,,,,,,,,,,
A131,ALBANO DI LUCANIA,PZ,0.8,,,,,,,,,,,,,,
A132,ALBANO LAZIALE,RM,0.8,,,,,,,,,,,,,,
A135,ALBAREDO PER SAN MARCO,SO,0*,,,,,,,,,,,,,,
A137,ALBAREDO D'ADIGE,VR,0.8,,,,,,,,,,,,,,
A138,ALBARETO,PR,0.8,,,,,,,,,,,,,,
A139,ALBARETTO DELLA TORRE,CN,,0.5,0.65,0.69,0.7,,,,,,,,,
A143,ALBAVILLA,CO,0.8,,,,,,,,,,,13.000,00,
A145,ALBENGA,SV,,0.65,0.68,0.73,0.8,,,,,,,,,
A146,ALBERA LIGURE,AL,0.45,,,,,,,,,,,,,,
A149,ALBEROBELLO,BA,,0.6,0.7,0.78,0.8,,,,,,,,,7.500.00,
A150,ALBERONA,FG,0,,,,,,,,,,,,,,
A153,ALBESE CON CASSANO,CO,0.5,,,,,,,,,,,,,,
A154,ALBETTONE,VI,0.5,,,,,,,,,,,15.000,00,
A155,ALBI,CZ,0.6,,,,,,,,,,,,,,
A157,ALBIANO D'IVREA,TO,,0.54,0.61,0.68,0.75,,,,,,,,,
A158,ALBIANO,TN,0*,,,,,,,,,,,,,,
A159,ALBIATE,MB,0.8,,,,,,,,,,,,,,
A160,ALBIDONA,CS,0.2,,,,,,,,,,,,,,
A161,ALBIGNASEGO,PD,0.8,,,,,,,,,,,12.670,00,
A162,ALBINEA,RE,,0.55,0.55,0.7,0.8,,,,,,,,,10.000,00,
A163,ALBINO,BG,,0.58,0.74,0.78,0.8,,,,,,,,,
A164,ALBIOLO,CO,,0.45,0.5,0.6,,,,,,,,,,,15.000,00,
A165,ALBISSOLA MARINA,SV,0.8,,,,,,,,,,,10.000,00,
A166,ALBISOLA SUPERIORE,SV,0.8,,,,,,,,,,,,,,
A167,ALBIZZATE,VA,0.8,,,,,,,,,,,,,,
A171,ALBONESE,PV,0*,,,,,,,,,,,,,,
A172,ALBOSAGGIA,SO,0*,,,,,,,,,,,,,,
A173,ALBUGNANO,AT,0.4,,,,,,,,,,,,,,
A175,ALBUZZANO,PV,0.8,,,,,,,,,,,10.999,99,
A176,ALCAMO,TP,0.8,,,,,,,,,,,7.499,99,
A177,ALCARA LI FUSI,ME,0.6,,,,,,,,,,,,,,
A178,ALDENO,TN,0*,,,,,,,,,,,,,,
A179,ALDINO,BZ,0*,,,,,,,,,,,,,,
A180,ALES,OR,0*,,,,,,,,,,,,,,
A181,ALESSANDRIA DELLA ROCCA,AG,,0.2,0.3,0.4,0.6,,,,,,,,,,7.500,00,
A182,ALESSANDRIA,AL,,0.8,0.8,1.2,,,,,,,,,,,
A183,ALESSANDRIA DEL CARRETTO,CS,0.3,,,,,,,,,,,,,,
A184,ALESSANO,LE,0.8,,,,,,,,,,,,,,
A185,ALEZIO,LE,0.8,,,,,,,,,,,,,,
A186,ALFANO,SA,0.3,,,,,,,,,,,,,,
A187,ALFEDENA,AQ,0.4,,,,,,,,,,,,,,
A188,ALFIANELLO,BS,0.2,,,,,,,,,,,,,,
A189,ALFIANO NATTA,AL,0.5,,,,,,,,,,,,,,
A191,ALFONSINE,RA,,0.7,0.73,0.77,0.8,,,,,,,,,
A192,ALGHERO,SS,0.8,,,,,,,,,,,,,,
A193,ALGUA,BG,0.8,,,,,,,,,,,,,,
A194,ALI',ME,0.8,,,,,,,,,,,8.000,00,
A195,ALIA,PA,0.8,,,,,,,,,,,,,,
A196,ALIANO,MT,0.8,,,,,,,,,,,,,,
A197,ALICE BEL COLLE,AL,0.5,,,,,,,,,,,,,,
A198,ALICE CASTELLO,VC,0.6,,,,,,,,,,,9.999,99,
A200,ALIFE,CE,0.8,,,,,,,,,,,,,,
A201,ALI' TERME,ME,0.8,,,,,,,,,,,,,,
A202,ALIMENA,PA,0.5,,,,,,,,,,,,,,
A203,ALIMINUSA,PA,0.8,,,,,,,,,,,,,,
A204,ALLAI,OR,0*,,,,,,,,,,,,,,
A205,ALLEIN,AO,0*,,,,,,,,,,,,,,
A206,ALLEGHE,BL,0.8,,,,,,,,,,,,,,
A207,ALLERONA,TR,0.8,,,,,,,,,,,,,,
A208,ALLISTE,LE,0.8,,,,,,,,,,,8.500,00,
A210,ALLUMIERE,RM,0.8,,,,,,,,,,,13.000,00,
A214,ALME,BG,,0.74,0.78,0.8,,,,,,,,,,,
A215,VILLA D'ALME',BG,,0.74,0.78,0.8,,,,,,,,,,,
A216,ALMENNO SAN BARTOLOMEO,BG,0.8,,,,,,,,,,,,,,
A217,ALMENNO SAN SALVATORE,BG,0.7,,,,,,,,,,,,,,
A218,ALMESE,TO,0.7,,,,,,,,,,,,,,
A220,ALONTE,VI,0.8,,,,,,,,,,,50.000,00,
A221,ALPETTE,TO,0.1,,,,,,,,,,,,,,
A222,ALPIGNANO,TO,,0.55,0.65,0.75,0.8,,,,,,,,,12.000.00,
A223,ALSENO,PC,,0.74,0.76,0.78,0.8,,,,,,,,,9.999,99,
A224,ALSERIO,CO,0.8,,,,,,,,,,,9.999,99,
A225,ALTAMURA,BA,0.8,,,,,,,,,,,,,,
A226,ALTARE,SV,0.7,,,,,,,,,,,,,,
A227,ALTAVILLA MONFERRATO,AL,0.6,,,,,,,,,,,,,,
A228,ALTAVILLA IRPINA,AV,,0.55,0.6,0.7,0.8,,,,,,,,,6.000,00,
A229,ALTAVILLA MILICIA,PA,0.8,,,,,,,,,,,,,,
A230,ALTAVILLA SILENTINA,SA,0.8,,,,,,,,,,,,,,
A231,ALTAVILLA VICENTINA,VI,0.8,,,,,,,,,,,12.000,00,
A233,ALTIDONA,FM,0.8,,,,,,,,,,,7.999,99,
A234,ALTILIA,CS,0.8,,,,,,,,,,,,,,
A235,ALTINO,CH,0.8,,,,,,,,,,,7.999,99,
A236,ALTISSIMO,VI,0.8,,,,,,,,,,,,,,
A237,ALTIVOLE,TV,0.4,,,,,,,,,,,10.000,00,
A238,ALTO,CN,0.8,,,,,,,,,,,,,,
A239,ALTOFONTE,PA,0.8,,,,,,,,,,,7.499.99,
A240,ALTOMONTE,CS,0.5,,,,,,,,,,,15.000,00,NOTA
A241,ALTOPASCIO,LU,0.8,,,,,,,,,,,,,,
A242,ALVIANO,TR,0.6,,,,,,,,,,,,,,
A243,ALVIGNANO,CE,0.8,,,,,,,,,,,,,,
A244,ALVITO,FR,0.8,,,,,,,,,,,,,,
A245,ALZANO SCRIVIA,AL,0.8,,,,,,,,,,,,,,
A246,ALZANO LOMBARDO,BG,0.8,,,,,,,,,,,14.999,99,
A249,ALZATE BRIANZA,CO,0.8,,,,,,,,,,,5.999,99,
A251,AMALFI,SA,0.7,,,,,,,,,,,15.000,00,
A252,AMANDOLA,FM,0.7,,,,,,,,,,,,,,
A253,AMANTEA,CS,0.8,,,,,,,,,,,,,,
A254,AMARO,UD,0*,,,,,,,,,,,,,,
A255,AMARONI,CZ,0.4,,,,,,,,,,,,,,
A256,AMASENO,FR,0.8,,,,,,,,,,,,,,
A257,AMATO,CZ,0.8,,,,,,,,,,,,,,
A258,AMATRICE,RI,0.8,,,,,,,,,,,10.000,00,
A259,AMBIVERE,BG,0.8,,,,,,,,,,,10.000.00,
A261,AMEGLIA,SP,,0.6,0.65,0.7,0.75,,,,,,,,,10.000,00,
A262,AMELIA,TR,0.8,,,,,,,,,,,11.000,00,
A263,AMENDOLARA,CS,0.8,,,,,,,,,,,,,,
A264,AMENO,NO,0.2,,,,,,,,,,,12.000.00,
A265,AMOROSI,BN,0.8,,,,,,,,,,,,,,
A266,CORTINA D'AMPEZZO,BL,0*,,,,,,,,,,,,,,
A267,AMPEZZO,UD,0.4,,,,,,,,,,,,,,
A268,ANACAPRI,NA,,0.4,0.41,0.6,0.79,,,,,,,,,
A269,ANAGNI,FR,0.8,,,,,,,,,,,,,,
A270,ANCARANO,TE,0.6,,,,,,,,,,,,,,
A271,ANCONA,AN,0.8,,,,,,,,,,,,,,
A272,ANDALI,CZ,0*,,,,,,,,,,,,,,
A273,ANDALO VALTELLINO,SO,0*,,,,,,,,,,,,,,
A274,ANDALO,TN,0*,,,,,,,,,,,,,,
A275,ANDEZENO,TO,0.75,,,,,,,,,,,,,,
A278,ANDORA,SV,0*,,,,,,,,,,,,,,
A280,ANDORNO MICCA,BI,0.8,,,,,,,,,,,,,,
A281,ANDRANO,LE,0.8,,,,,,,,,,,,,,
A282,ANDRATE,TO,0.8,,,,,,,,,,,,,,
A283,ANDREIS,PN,0*,,,,,,,,,,,,,,
A284,ANDRETTA,AV,0.8,,,,,,,,,,,,,,
A285,ANDRIA,BT,0.8,,,,,,,,,,,7.500.00,
A286,ANDRIANO,BZ,0*,,,,,,,,,,,,,,
A287,ANELA,SS,0*,,,,,,,,,,,,,,
A288,ANFO,BS,0.7,,,,,,,,,,,,,,
A290,ANGERA,VA,0.7,,,,,,,,,,,10.000,00,
A291,ANGHIARI,AR,0.8,,,,,,,,,,,10.499,99,
A292,ANGIARI,VR,0.8,,,,,,,,,,,,,,
A293,ANGOLO TERME,BS,0.6,,,,,,,,,,,10.000,00,
A294,ANGRI,SA,0.6,,,,,,,,,,,12.000,00,
A295,ANGROGNA,TO,0.65,,,,,,,,,,,12.000,00,
A296,ANGUILLARA VENETA,PD,0.79,,,,,,,,,,,10.000,00,
A297,ANGUILLARA SABAZIA,RM,0.8,,,,,,,,,,,,,,
A299,ANNICCO,CR,0.8,,,,,,,,,,,,,,
A300,CASTELLO DI ANNONE,AT,0.2,,,,,,,,,,,,,,
A301,ANNONE DI BRIANZA,LC,,0.5,0.55,0.6,0.65,,,,,,,,,15.000,00,
A302,ANNONE VENETO,VE,0.8,,,,,,,,,,,10.000.00,
A303,ANOIA,RC,0.8,,,,,,,,,,,,,,
A304,ANTEGNATE,BG,0.8,,,,,,,,,,,10.000,00,
A305,ANTEY-SAINT-ANDRE',AO,0*,,,,,,,,,,,,,,
A306,ANTERIVO,BZ,0*,,,,,,,,,,,,,,
A308,LA MAGDELEINE,AO,0*,,,,,,,,,,,,,,
A309,ANTICOLI CORRADO,RM,0.2,,,,,,,,,,,,,,
A310,FIUGGI,FR,,0.7,0.7,0.8,,,,,,,,,,,15.000,00,
A312,ANTIGNANO,AT,0.6,,,,,,,,,,,,,,
A313,ANTILLO,ME,0.8,,,,,,,,,,,,,,
A314,ANTONIMINA,RC,0.4,,,,,,,,,,,,,,
A315,ANTRODOCO,RI,0.8,,,,,,,,,,,,,,
A317,ANTRONA SCHIERANCO,VB,0*,,,,,,,,,,,,,,
A318,ANVERSA DEGLI ABRUZZI,AQ,0.6,,,,,,,,,,,,,,
A319,ANZANO DEL PARCO,CO,,0.4,0.4,0.4,0.6,,,,,,,,,15.000,00,
A320,ANZANO DI PUGLIA,FG,,0.6,0.65,0.75,0.8,,,,,,,,,
A321,ANZI,PZ,0.4,,,,,,,,,,,,,,
A323,ANZIO,RM,0.8,,,,,,,,,,,12.000,00,
A324,ANZOLA DELL'EMILIA,BO,0.8,,,,,,,,,,,13.000,00,
A325,ANZOLA D'OSSOLA,VB,,0.45,0.55,0.65,0.8,,,,,,,,,10.000,00,
A326,AOSTA,AO,0.5,,,,,,,,,,,9.999,99,
A327,APECCHIO,PU,0.7,,,,,,,,,,,,,,
A328,APICE,BN,0.8,,,,,,,,,,,,,,
A329,APIRO,MC,0.8,,,,,,,,,,,,,,
A330,APOLLOSA,BN,0.4,,,,,,,,,,,,,,
A332,APPIANO SULLA STRADA DEL VINO,BZ,,0.15,0.35,0.55,0.8,,,,,,,,,25.000,00,
A333,APPIANO GENTILE,CO,,0.27,0.6,0.8,,,,,,,,,,,
A334,APPIGNANO,MC,0.65,,,,,,,,,,,,,,
A335,APPIGNANO DEL TRONTO,AP,0.8,,,,,,,,,,,,,,
A337,APRICA,SO,0.8,,,,,,,,,,,9.000,00,
A338,APRICALE,IM,0.8,,,,,,,,,,,,,,
A339,APRICENA,FG,0.7,,,,,,,,,,,,,,
A340,APRIGLIANO,CS,0.5,,,,,,,,,,,,,,
A341,APRILIA,LT,0.8,,,,,,,,,,,8.500,00,
A343,AQUARA,SA,0.8,,,,,,,,,,,,,,
A344,AQUILA D'ARROSCIA,IM,0.8,,,,,,,,,,,,,,
A345,L'AQUILA,AQ,0.6,,,,,,,,,,,15.000,00,
A346,AQUILEIA,UD,,0.3,0.4,0.6,0.78,,,,,,,,,,15.000,00,
A347,AQUILONIA,AV,0*,,,,,,,,,,,,,,
A348,AQUINO,FR,0.8,,,,,,,,,,,8.000,00,
A350,ARADEO,LE,0.8,,,,,,,,,,,,,,
A351,ARAGONA,AG,0.8,,,,,,,,,,,,,,
A352,ARAMENGO,AT,0.8,,,,,,,,,,,,,,
A354,ARBA,PN,0.5,,,,,,,,,,,10.000,00,
A355,TORTOLI',NU,0.8,,,,,,,,,,,,,,
A357,ARBOREA,OR,,0.2,0.4,0.55,0.75,,,,,,,,,10.000,00,
A358,ARBORIO,VC,0.8,,,,,,,,,,,,,,
A359,ARBUS,SU,0.1,,,,,,,,,,,,,,
A360,ARCADE,TV,,0.6,0.65,0.7,0.75,,,,,,,,,10.000,00,
A363,ARCE,FR,0.8,,,,,,,,,,,6.500,00,
A365,ARCENE,BG,,0.65,0.68,0.72,0.8,,,,,,,,,7.500,00,
A366,ARCEVIA,AN,0.8,,,,,,,,,,,,,,
A367,ARCHI,CH,0.8,,,,,,,,,,,,,,
A368,SAN NICOLO' D'ARCIDANO,OR,0.3,,,,,,,,,,,10.000.00,
A369,ARCIDOSSO,GR,0.6,,,,,,,,,,,,,,
A370,ARCINAZZO ROMANO,RM,0.6,,,,,,,,,,,,,,
A371,ARCISATE,VA,0.6,,,,,,,,,,,10.000,00,
A372,ARCO,TN,0*,,,,,,,,,,,,,,
A373,ARCOLA,SP,0.8,,,,,,,,,,,12.000,00,
A374,ARCOLE,VR,,0.45,0.5,0.6,0.8,,,,,,,,,
A375,ARCONATE,MI,0.8,,,,,,,,,,,10.000,00,
A376,ARCORE,MB,0.8,,,,,,,,,,,14.999,99,
A377,ARCUGNANO,VI,,0.7,0.77,0.78,0.8,,,,,,,,,10.000,00,
A379,ARDARA,SS,0*,,,,,,,,,,,,,,
A380,ARDAULI,OR,0*,,,,,,,,,,,,,,
A382,ARDENNO,SO,0*,,,,,,,,,,,,,,
A383,ARDESIO,BG,0.8,,,,,,,,,,,,,,
A385,ARDORE,RC,0.7,,,,,,,,,,,7.499,99,
A386,ARENA,W,,0.4,0.5,0.6,0.7,,,,,,,,,5.500,00,
A387,ARENA PO,PV,0.5,,,,,,,,,,,10.500,00,
A388,ARENZANO,GE,0.2,,,,,,,,,,,,,,
A389,ARESE,MI,,0.48,0.5,0.79,0.8,,,,,,,,,16.999,99,
A390,AREZZO,AR,,0.48,0.49,0.78,0.79,,,,,,,,,,13.500,00,
A391,ARGEGNO,CO,0.6,,,,,,,,,,,10.000,00,
A392,ARGELATO,BO,0.8,,,,,,,,,,,,,,
A393,ARGENTA,FE,0.8,,,,,,,,,,,7.999.99,
A394,ARGENTERA,CN,0.8,,,,,,,,,,,,,,
A396,ARGUELLO,CN,0.8,,,,,,,,,,,,,,
A397,ARGUSTO,CZ,0*,,,,,,,,,,,,,,
A398,ARI,CH,0.8,,,,,,,,,,,,,,
A399,ARIANO IRPINO,AV,0.8,,,,,,,,,,,,,,
A400,ARIANO NEL POLESINE,RO,0.7,,,,,,,,,,,,,,
A401,ARICCIA,RM,0.8,,,,,,,,,,,12.000,00,
A402,ARIELLI,CH,0,,,,,,,,,,,,,,
A403,ARIENZO,CE,0.8,,,,,,,,,,,,,,
A405,ARIGNANO,TO,0.5,,,,,,,,,,,,,,
A407,ARITZO,NU,0.2,,,,,,,,,,,,,,
A409,ARIZZANO,VB,0.5,,,,,,,,,,,,,,
A412,ARLENA DI CASTRO,VT,0.7,,,,,,,,,,,,,,
A413,ARLUNO,MI,0.8,,,,,,,,,,,,,,
A414,ARMENO,NO,0.2,,,,,,,,,,,,,,
A415,ARMENTO,PZ,0*,,,,,,,,,,,,,,
A418,ARMO,IM,0.8,,,,,,,,,,,,,,
A419,ARMUNGIA,SU,0*,,,,,,,,,,,,,,
A421,ARNARA,FR,0.6,,,,,,,,,,,,,,
A422,ARNASCO,SV,0.8,,,,,,,,,,,,,,
A424,ARNAD,AO,0*,,,,,,,,,,,,,,
A425,ARNESANO,LE,0.45,,,,,,,,,,,10.000.00,
A427,AROLA,VB,0.4,,,,,,,,,,,,,,
A429,ARONA,NO,0.8,,,,,,,,,,,12.500,00,
A430,AROSIO,CO,0.8,,,,,,,,,,,,,,
A431,ARPAIA,BN,0.8,,,,,,,,,,,,,,
A432,ARPAISE,BN,0.5,,,,,,,,,,,,,,
A433,ARPINO,FR,0.8,,,,,,,,,,,,,,
A434,ARQUA' PETRARCA,PD,,0.65,0.72,0.74,,,,,,,,,,,10.000,00,
A435,ARQUA' POLESINE,RO,0.7,,,,,,,,,,,9.999,99,
A436,ARQUATA SCRIVIA,AL,,0.76,0.77,0.8,,,,,,,,,,,10.000,00,
A437,ARQUATA DEL TRONTO,AP,0.6,,,,,,,,,,,8.000,00,
A438,ARRE,PD,0.8,,,,,,,,,,,,,,
A439,ARRONE,TR,0.8,,,,,,,,,,,12.000,00,
A440,ARZAGO D'ADDA,BG,0.8,,,,,,,,,,,10.000,00,
A441,ARSAGO SEPRIO,VA,0.8,,,,,,,,,,,12.000,00,
A443,ARSIE,BL,0.8,,,,,,,,,,,,,,
A444,ARSIERO,VI,,0.73,0.76,0.78,0.8,,,,,,,,,15.000,00,
A445,ARSITA,TE,0.6,,,,,,,,,,,,,,
A446,ARSOLI,RM,0.6,,,,,,,,,,,,,,
A447,ARTA TERME,UD,0.6,,,,,,,,,,,,,,
A448,ARTEGNA,UD,0.5,,,,,,,,,,,,,,
A449,ARTENA,RM,0.8,,,,,,,,,,,,,,
A451,ARTOGNE,BS,0.8,,,,,,,,,,,,,,
A452,ARVIER,AO,0*,,,,,,,,,,,,,,
A453,ARZACHENA,SS,0*,,,,,,,,,,,,,,
A454,ARZANA,NU,0*,,,,,,,,,,,,,,
A455,ARZANO,NA,0.8,,,,,,,,,,,6.000.00,
A458,ARZERGRANDE,PD,0.8,,,,,,,,,,,,,,
A459,ARZIGNANO,VI,0.8,,,,,,,,,,,,,,
A460,ASCEA,SA,0.8,,,,,,,,,,,,,,
A461,ASCIANO,SI,,0.7,0.72,0.75,0.78,,,,,,,,,,8.500,00,
A462,ASCOLI PICENO,AP,0.8,,,,,,,,,,,8.500,00,
A463,ASCOLI SATRIANO,FG,0.8,,,,,,,,,,,,,,
A464,ASCREA,RI,0.7,,,,,,,,,,,,,,
A465,ASIAGO,VI,0.8,,,,,,,,,,,,,,
A466,ASIGLIANO VERCELLESE,VC,0.48,,,,,,,,,,,,,,
A467,ASIGLIANO VENETO,VI,0.3,,,,,,,,,,,15.000,00,
A468,SINALUNGA,SI,,0.75,0.79,0.8,0.8,,,,,,,,,NOTA
A470,ASOLA,MN,,0.65,0.79,0.8,,,,,,,,,,,16.000,00,
A471,ASOLO,TV,,0.4,0.5,0.6,0.75,,,,,,,,,10.000,00,
A472,CASPERIA,RI,0.8,,,,,,,,,,,,,,
A473,ASSAGO,MI,0*,,,,,,,,,,,,,,
A474,ASSEMINI,CA,0.4,,,,,,,,,,,,,,
A475,ASSISI,PG,0*,,,,,,,,,,,,,,
A476,ASSO,CO,0.6,,,,,,,,,,,12.000,00,
A477,ASSOLO,OR,0.5,,,,,,,,,,,,,,
A478,ASSORO,EN,0.8,,,,,,,,,,,10.000.00,
A479,ASTI,AT,,0.54,0.66,0.78,0.79,,,,,,,,,,7.500,00,
A480,ASUNI,OR,0*,,,,,,,,,,,,,,
A481,ATELETA,AQ,0.4,,,,,,,,,,,,,,
A482,ATELLA,PZ,0.6,,,,,,,,,,,,,,
A484,ATENA LUCANA,SA,0.5,,,,,,,,,,,10.000,00,
A485,ATESSA,CH,,0.5,0.7,0.75,0.8,,,,,,,,,13.000,00,
A486,ATINA,FR,0.8,,,,,,,,,,,7.999.99,
A487,ATRANI,SA,0.5,,,,,,,,,,,,,,
A488,ATRI,TE,0.8,,,,,,,,,,,,,,
A489,ATRIPALDA,AV,0.8,,,,,,,,,,,,,,
A490,ATTIGLIANO,TR,0.8,,,,,,,,,,,,,,
A491,ATTIMIS,UD,0.4,,,,,,,,,,,12.500,00,
A492,ATZARA,NU,0*,,,,,,,,,,,,,,
A494,AUGUSTA,SR,0.8,,,,,,,,,,,,,,
A495,AULETTA,SA,0.8,,,,,,,,,,,,,,
A496,AULLA,MS,0.8,,,,,,,,,,,7.999,99,
A497,AURANO,VB,0*,,,,,,,,,,,,,,
A499,AURIGO,IM,0.8,,,,,,,,,,,,,,
A501,AURONZO DI CADORE,BL,0.4,,,,,,,,,,,5.999,99,
A502,AUSONIA,FR,0.8,,,,,,,,,,,,,,
A503,AUSTIS,NU,0.5,,,,,,,,,,,,,,
A506,AVEGNO,GE,0.8,,,,,,,,,,,,,,
A507,AVELENGO,BZ,0*,,,,,,,,,,,,,,
A508,AVELLA,AV,0.8,,,,,,,,,,,,,,
e così via per tutte le 58 pagine.
`;

const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                resolve('');
            }
        };
        reader.readAsDataURL(file);
    });
    const data = await base64EncodedDataPromise;
    return {
        inlineData: {
            mimeType: file.type,
            data
        },
    };
};

// Tipi "grezzi" per l'estrazione a 2 step

type RawRemunerationElement = {
    label: string;   // es. "PAGA BASE"
    value: string;   // es. "1.429,19"
};

type RawVoceVariabile = {
    code: string;         // es. "F00880"
    description: string;  // es. "Rimborsi da 730"
    trattenute: string;   // valore nella penultima colonna (TRATTENUTE) o "" se vuota
    competenze: string;   // valore nell'ultima colonna (COMPETENZE) o "" se vuota
};

type RawRiepilogo = {
    stipendioLordo: string;       // "Stipendio lordo" o "Totale competenze"
    totaleTrattenute: string;     // "Totale trattenute"
    nettoMese: string;            // "Netto del mese", "Netto in busta"

    // fiscali
    imponibileFiscale?: string;
    impostaLorda?: string;
    detrazioniLavoroDipendente?: string;
    detrazioniFamiliari?: string;
    detrazioniTotali?: string;
    impostaNetta?: string;
    addizionaleRegionale?: string;
    addizionaleComunale?: string;
    addizionaleComunaleAcconto?: string;

    // previdenziali
    imponibilePrevidenziale?: string;
    contributiDipendente?: string;
    contributiAzienda?: string;
    contributoInail?: string;

    // TFR
    imponibileTfr?: string;
    quotaTfr?: string;
    fondoTfrPrecedente?: string;
    fondoTfrTotale?: string;

    // ferie / permessi
    ferieSaldoPrecedente?: string;
    ferieMaturate?: string;
    ferieGodute?: string;
    ferieSaldoResiduo?: string;

    rolSaldoPrecedente?: string;
    rolMaturati?: string;
    rolGoduti?: string;
    rolSaldoResiduo?: string;
};

type RawHeader = {
    companyName: string;
    companyTaxId: string;
    companyAddress: string;

    employeeFirstName: string;
    employeeLastName: string;
    employeeTaxId: string;
    employeeDateOfBirth?: string;
    employeePlaceOfBirth?: string;

    level?: string;
    contractType?: string;

    month: number; // 1-12
    year: number;

    remunerationElements: RawRemunerationElement[];
};

type RawPayslip = {
    header: RawHeader;
    vociVariabili: RawVoceVariabile[];
    riepilogo: RawRiepilogo;
};

const payItemSchema = {
    type: Type.OBJECT,
    properties: {
        description: { type: Type.STRING, description: "La descrizione della voce (es. 'Paga Base', 'Straordinari', 'Contributi IVS')." },
        quantity: { type: Type.NUMBER, description: "La quantità, se applicabile (es. ore di straordinario)." },
        rate: { type: Type.NUMBER, description: "L'importo unitario o la percentuale, se applicabile." },
        value: { type: Type.NUMBER, description: "Il valore economico totale della voce." }
    },
    required: ['description', 'value']
};

const leaveBalanceSchema = {
    type: Type.OBJECT,
    properties: {
        previous: { type: Type.NUMBER, description: "Saldo anno/periodo precedente (in ORE, non giorni)." },
        accrued: { type: Type.NUMBER, description: "Maturato da inizio anno (progressivo annuale in ORE). ATTENZIONE: questo è il totale maturato dall'inizio dell'anno, NON solo il mese corrente." },
        taken: { type: Type.NUMBER, description: "Goduto/usato da inizio anno (in ORE)." },
        balance: { type: Type.NUMBER, description: "Saldo residuo totale (in ORE)." }
    },
    required: ['previous', 'accrued', 'taken', 'balance']
};

// Schema per Gemini (estrazione grezza)
const rawPayslipSchema = {
    type: Type.OBJECT,
    properties: {
        header: {
            type: Type.OBJECT,
            properties: {
                companyName: { type: Type.STRING, description: "Ragione sociale dell'azienda." },
                companyTaxId: { type: Type.STRING, description: "Partita IVA / Codice fiscale dell'azienda." },
                companyAddress: { type: Type.STRING, description: "Indirizzo completo dell'azienda." },
                employeeFirstName: { type: Type.STRING, description: "Nome del dipendente." },
                employeeLastName: { type: Type.STRING, description: "Cognome del dipendente." },
                employeeTaxId: { type: Type.STRING, description: "Codice fiscale del dipendente." },
                employeeDateOfBirth: { type: Type.STRING, description: "Data di nascita del dipendente." },
                employeePlaceOfBirth: { type: Type.STRING, description: "Luogo di nascita del dipendente." },
                level: { type: Type.STRING, description: "Livello/qualifica contrattuale (se leggibile)." },
                contractType: { type: Type.STRING, description: "Tipo contratto e CCNL (se leggibile)." },
                month: { type: Type.INTEGER, description: "Mese di riferimento (1-12)." },
                year: { type: Type.INTEGER, description: "Anno di riferimento (quattro cifre)." },
                remunerationElements: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            label: { type: Type.STRING, description: "Nome voce fissa (es. 'PAGA BASE')." },
                            value: { type: Type.STRING, description: "Valore così come appare (es. '1.429,19')." }
                        },
                        required: ["label", "value"]
                    },
                    description: "Elementi della retribuzione fissa (Paga base, Contingenza, Scatti, ecc.)."
                }
            },
            required: [
                "companyName",
                "companyTaxId",
                "companyAddress",
                "employeeFirstName",
                "employeeLastName",
                "employeeTaxId",
                "month",
                "year",
                "remunerationElements"
            ]
        },
        vociVariabili: {
            type: Type.ARRAY,
            description: "Corpo centrale: una riga per ogni voce variabile della tabella.",
            items: {
                type: Type.OBJECT,
                properties: {
                    code: { type: Type.STRING, description: "Codice voce (es. 'Z00001', 'F00880')." },
                    description: { type: Type.STRING, description: "Descrizione voce." },
                    trattenute: { type: Type.STRING, description: "Importo in colonna TRATTENUTE (penultima colonna) o stringa vuota se assente." },
                    competenze: { type: Type.STRING, description: "Importo in colonna COMPETENZE (ultima colonna) o stringa vuota se assente." }
                },
                required: ["description", "trattenute", "competenze"]
            }
        },
        riepilogo: {
            type: Type.OBJECT,
            properties: {
                stipendioLordo: { type: Type.STRING, description: "Stipendio lordo / Totale competenze del mese." },
                totaleTrattenute: { type: Type.STRING, description: "Totale trattenute del mese." },
                nettoMese: { type: Type.STRING, description: "Netto del mese / Netto in busta." },

                imponibileFiscale: { type: Type.STRING },
                impostaLorda: { type: Type.STRING },
                detrazioniLavoroDipendente: { type: Type.STRING },
                detrazioniFamiliari: { type: Type.STRING },
                detrazioniTotali: { type: Type.STRING },
                impostaNetta: { type: Type.STRING },
                addizionaleRegionale: { type: Type.STRING },
                addizionaleComunale: { type: Type.STRING },
                addizionaleComunaleAcconto: { type: Type.STRING },

                imponibilePrevidenziale: { type: Type.STRING },
                contributiDipendente: { type: Type.STRING },
                contributiAzienda: { type: Type.STRING },
                contributoInail: { type: Type.STRING },

                imponibileTfr: { type: Type.STRING },
                quotaTfr: { type: Type.STRING },
                fondoTfrPrecedente: { type: Type.STRING },
                fondoTfrTotale: { type: Type.STRING },

                ferieSaldoPrecedente: { type: Type.STRING },
                ferieMaturate: { type: Type.STRING },
                ferieGodute: { type: Type.STRING },
                ferieSaldoResiduo: { type: Type.STRING },

                rolSaldoPrecedente: { type: Type.STRING },
                rolMaturati: { type: Type.STRING },
                rolGoduti: { type: Type.STRING },
                rolSaldoResiduo: { type: Type.STRING }
            },
            required: ["stipendioLordo", "totaleTrattenute", "nettoMese"]
        }
    },
    required: ["header", "vociVariabili", "riepilogo"]
};

const payslipSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING, description: "Un UUID univoco generato per questo documento." },
        period: {
            type: Type.OBJECT,
            properties: {
                month: { type: Type.INTEGER, description: "Il mese di riferimento (es. 6 per Giugno)." },
                year: { type: Type.INTEGER, description: "L'anno di riferimento." },
            },
            required: ['month', 'year']
        },
        company: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: "Ragione Sociale dell'azienda." },
                taxId: { type: Type.STRING, description: "Partita IVA / Codice Fiscale dell'azienda." },
                address: { type: Type.STRING, description: "Indirizzo completo dell'azienda." },
            },
            required: ['name', 'taxId']
        },
        employee: {
            type: Type.OBJECT,
            properties: {
                firstName: { type: Type.STRING, description: "Nome del dipendente." },
                lastName: { type: Type.STRING, description: "Cognome del dipendente." },
                taxId: { type: Type.STRING, description: "Codice Fiscale del dipendente." },
                dateOfBirth: { type: Type.STRING, description: "Data di nascita del dipendente (formato: GG/MM/AAAA o simile). OBBLIGATORIO: estrai sempre questo campo dalla sezione Dati Anagrafici della busta paga." },
                placeOfBirth: { type: Type.STRING, description: "Luogo di nascita del dipendente (città o comune). Estrarre se presente nella sezione Dati Anagrafici della busta paga." },
                level: { type: Type.STRING, description: "Livello contrattuale del dipendente." },
                contractType: { type: Type.STRING, description: "Tipo di contratto (es. 'Commercio', 'Metalmeccanico')." },
            },
            required: ['firstName', 'lastName', 'taxId', 'dateOfBirth']
        },
        remunerationElements: { 
            type: Type.ARRAY, 
            items: payItemSchema, 
            description: "Elenco dettagliato delle voci fisse che compongono la retribuzione mensile di base (es. 'Paga Base', 'Contingenza', 'Scatti Anzianità', 'Superminimo'). Estrai questi dati dalla sezione 'Elementi della Retribuzione' o simile." 
        },
        incomeItems: { type: Type.ARRAY, items: payItemSchema, description: "Elenco di tutte le voci a favore del dipendente (competenze), INCLUSE le voci della retribuzione di base." },
        deductionItems: { type: Type.ARRAY, items: payItemSchema, description: "Elenco di tutte le voci a carico del dipendente (trattenute previdenziali, fiscali, etc.)." },
        grossSalary: { type: Type.NUMBER, description: "Retribuzione Lorda o Totale Competenze." },
        totalDeductions: { type: Type.NUMBER, description: "Totale delle trattenute." },
        netSalary: { type: Type.NUMBER, description: "Netto a pagare o Netto in busta." },
        taxData: {
            type: Type.OBJECT,
            properties: {
                taxableBase: { type: Type.NUMBER, description: "Imponibile Fiscale (o Imponibile IRPEF)." },
                grossTax: { type: Type.NUMBER, description: "Imposta Lorda IRPEF." },
                deductions: {
                    type: Type.OBJECT,
                    properties: {
                        employee: { type: Type.NUMBER, description: "Detrazione per lavoro dipendente." },
                        family: { type: Type.NUMBER, description: "Detrazioni per familiari a carico (se presenti, altrimenti 0)." },
                        total: { type: Type.NUMBER, description: "Totale delle detrazioni fiscali applicate." },
                    },
                     required: ['employee', 'total']
                },
                netTax: { type: Type.NUMBER, description: "Imposta Netta IRPEF." },
                regionalSurtax: { type: Type.NUMBER, description: "Addizionale Regionale IRPEF." },
                municipalSurtax: { type: Type.NUMBER, description: "Addizionale Comunale IRPEF." },
            },
            required: ['taxableBase', 'grossTax', 'deductions', 'netTax', 'regionalSurtax', 'municipalSurtax']
        },
        socialSecurityData: {
            type: Type.OBJECT,
            properties: {
                taxableBase: { type: Type.NUMBER, description: "Imponibile Previdenziale (o Imponibile INPS)." },
                employeeContribution: { type: Type.NUMBER, description: "Contributi previdenziali a carico del dipendente." },
                companyContribution: { type: Type.NUMBER, description: "Contributi previdenziali a carico dell'azienda." },
                inailContribution: { type: Type.NUMBER, description: "Contributo INAIL, se specificato (altrimenti 0)." },
            },
            required: ['taxableBase', 'employeeContribution', 'companyContribution']
        },
        tfr: {
            type: Type.OBJECT,
            properties: {
                taxableBase: { type: Type.NUMBER, description: "Imponibile TFR del mese." },
                accrued: { type: Type.NUMBER, description: "Quota TFR maturata. ATTENZIONE: Se nel documento trovi 'Quota anno', 'Accantonamento anno' o simili, inserisci quel valore qui. Non lasciare a 0 se esiste un importo progressivo." },
                previousBalance: { type: Type.NUMBER, description: "Fondo TFR al 31/12 dell'anno precedente o al periodo precedente." },
                totalFund: { type: Type.NUMBER, description: "Fondo TFR totale e aggiornato." },
            },
            required: ['taxableBase', 'accrued', 'previousBalance', 'totalFund']
        },
        leaveData: {
            type: Type.OBJECT,
            properties: {
                vacation: { ...leaveBalanceSchema, description: "Dettaglio Ferie (tutti i valori in ORE, non giorni)." },
                permits: { ...leaveBalanceSchema, description: "Dettaglio Permessi/ROL (tutti i valori in ORE, non giorni)." },
                exHolidayPermits: { ...leaveBalanceSchema, description: "Dettaglio Permessi Ex Festività (tutti i valori in ORE, non giorni). Cerca 'Ex Fest', 'Ex Festività', 'Festività Abolite' o simili." },
                sickLeave: {
                    type: Type.OBJECT,
                    properties: {
                        taken: { type: Type.NUMBER, description: "Ore o giorni di malattia usufruiti nel periodo corrente. Cerca nella sezione 'Assenze' o tra le voci variabili per 'Malattia' o simili. Se non presente, omettere completamente questo oggetto." }
                    },
                    description: "Dettaglio malattia (se presente nella busta paga)."
                },
            },
            required: ['vacation', 'permits']
        },
    },
    required: ['id', 'period', 'company', 'employee', 'remunerationElements', 'incomeItems', 'deductionItems', 'grossSalary', 'totalDeductions', 'netSalary', 'taxData', 'socialSecurityData', 'tfr', 'leaveData']
};


const parseEuroStringToNumber = (raw: string | undefined | null): number => {
    if (!raw) return 0;
    const cleaned = raw
        .toString()
        .trim()
        .replace(/\./g, "")   // rimuove separatori migliaia
        .replace(",", ".")    // converte virgola in punto
        .replace(/[^\d.-]/g, ""); // rimuove simboli non numerici
    const n = Number(cleaned);
    return isNaN(n) ? 0 : n;
};

export const extractRawPayslip = async (file: File): Promise<RawPayslip> => {
    const imagePart = await fileToGenerativePart(file);

    const prompt = `
Sei un sistema OCR avanzato specializzato ESCLUSIVAMENTE in buste paga italiane Zucchetti.
Devi SOLO leggere e riportare i dati in modo tabellare, senza fare calcoli e senza interpretazioni fiscali.

OBIETTIVO:
Compila un JSON con tre blocchi:
1) header
2) vociVariabili
3) riepilogo

NON devi verificare i totali, NON devi inventare importi mancanti.
Se un importo non è chiaramente leggibile, usa una stringa vuota "".

########################
# HEADER
########################
- Estrai:
  - Ragione sociale azienda
  - Codice fiscale / Partita IVA azienda
  - Indirizzo azienda
  - Nome e cognome dipendente
  - Codice fiscale dipendente
  - Data di nascita dipendente
  - Luogo di nascita dipendente
  - Livello / qualifica (se leggibile)
  - Tipo contratto / CCNL (se leggibile)
  - Mese e anno di riferimento

- Estrai anche la sezione "Elementi della Retribuzione" (o simile).
  Per ogni voce (PAGA BASE, SCATTI, CONTING., E.D.R., IND.FUNZ., ecc.):
  - label = nome voce (es. "PAGA BASE")
  - value = valore come appare (es. "1.429,19")
  Ricorda: ETICHETTA SOPRA, VALORE SOTTO.

########################
# VOCI VARIABILI (CORPO CENTRALE)
########################
Inizia dalla tabella "VOCI VARIABILI DEL MESE".

IMPORTANTE: ESCLUDI completamente dalle vociVariabili le seguenti righe:
- F02000 Imponibile IRPEF
- F02010 IRPEF lorda
- F02500 Detrazioni lav.dip.
- F03020 Ritenute IRPEF
- F02703 Indennità L.207/24
- Qualsiasi altra voce F02*** o F03*** che contiene dati fiscali

Queste voci NON vanno in vociVariabili, ma solo in riepilogo (verranno estratte dopo).

Per TUTTE LE ALTRE righe della tabella:

- code: eventuale codice voce (es. "Z00001", "F00880", "F09110"). Se non presente, usa stringa vuota.
- description: descrizione completa della voce (es. "Rimborsi da 730", "Addizionale regionale").
- trattenute: importo nella colonna TRATTENUTE (penultima colonna a destra). Se vuota, metti "".
- competenze: importo nella colonna COMPETENZE (ultima colonna a destra). Se vuota, metti "".

REGOLE SPECIALI PER CASI DIFFICILI:

1) F00880 Rimborsi da 730:
   - Se sulla riga vedi "Residuo 327,00" (o simile), usa 327,00 come COMPETENZA.
   - Questo è un'ECCEZIONE: normalmente ignori "Residuo", ma per il 730 è l'importo corretto.

2) F09110/F09130/F09140 (Addizionali IRPEF):
   - Queste righe hanno SEMPRE due numeri: "Residuo XX,XX" e l'importo del mese.
   - Esempi:
     - "F09110 Addizionale regionale 2024 CAMPANIA Residuo 77,39 38,69"
       → trattenute = "38,69" (NON 77,39)
     - "F09130 Addizionale comunale 2024 CASORIA 13,78"
       → trattenute = "13,78"
     - "F09140 Acconto addiz. comunale 2025 CASORIA Residuo 10,99 5,50"
       → trattenute = "5,50" (NON 10,99)
   - Regola: prendi l'ULTIMO numero sulla riga, NON quello dopo "Residuo".

3) Z00001 Retribuzione:
   - Il valore piccolo tipo "12,11145" è la paga oraria → IGNORALO.
   - Il valore grosso (es. "1.170,12") è la competenza → PRENDILO.

4) Tutte le altre voci (Z00***, straordinari, ecc.):
   - trattenute = penultima colonna a destra
   - competenze = ultima colonna a destra

NON spostare mai un importo da una riga all'altra.
NON mescolare i numeri tra righe diverse.

########################
# RIEPILOGO
########################
Nella parte bassa del documento (piede), estrai:

TOTALI (OBBLIGATORI):
- stipendioLordo: "Stipendio lordo" o "Totale competenze".
- totaleTrattenute: "Totale trattenute".
- nettoMese: "Netto del mese" / "Netto in busta".

DATI FISCALI (dal piede, NON dalla tabella centrale):
Cerca la sezione "RIEPILOGO FISCALE" o simile nel piede del documento:
- imponibileFiscale: valore accanto a "Imponibile fiscale" o "F02000 Imponibile IRPEF"
- impostaLorda: valore accanto a "Imposta lorda" o "F02010 IRPEF lorda"
- detrazioniLavoroDipendente: valore accanto a "Detrazioni lav.dip." o "F02500"
- impostaNetta: valore accanto a "Imposta netta" o "F03020 Ritenute IRPEF"
- addizionaleRegionale: valore accanto a "Addizionale regionale" (progressivo totale)
- addizionaleComunale: valore accanto a "Addizionale comunale" (progressivo totale)

DATI PREVIDENZIALI:
- imponibilePrevidenziale: "Imponibile previdenziale"
- contributiDipendente: "Contributi dipendente"
- contributiAzienda: "Contributi azienda"
- contributoInail: "INAIL"

DATI TFR:
- imponibileTfr: "Imponibile TFR"
- quotaTfr: "Quota maturata" o "Accantonamento"
- fondoTfrPrecedente: "Fondo precedente"
- fondoTfrTotale: "Fondo totale"

FERIE E ROL:
IMPORTANTE: Compila questi campi SOLO se trovi una tabella esplicita di "RATEI" o "FERIE E PERMESSI" con colonne:
- Saldo precedente / Maturato / Goduto / Saldo residuo

Se NON trovi questa tabella, lascia TUTTI i campi ferie/ROL vuoti ("").
NON derivare ore dalle voci variabili "Ferie godute" o "ROL goduti".

Se trovi la tabella:
- ferieSaldoPrecedente, ferieMaturate, ferieGodute, ferieSaldoResiduo
- rolSaldoPrecedente, rolMaturati, rolGoduti, rolSaldoResiduo

Riporta gli importi esattamente come li leggi (es. "1.588,45").
NON fare calcoli, NON verificare coerenza: il tuo unico compito è leggere e riportare.

Rispondi SOLO con JSON valido che rispetti lo schema fornito (rawPayslipSchema).
`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
            { text: prompt },
            imagePart
        ],
        config: {
            responseMimeType: "application/json",
            responseSchema: rawPayslipSchema,
            temperature: 0.0,
            topP: 0.1,
            topK: 1
        }
    });

    const jsonStr = response.text.trim();

    try {
        const raw = JSON.parse(jsonStr) as RawPayslip;
        return raw;
    } catch (e) {
        console.error("Failed to parse raw payslip JSON:", jsonStr, e);
        throw new Error("L'estrazione grezza della busta paga non è valida. Verifica che il documento sia leggibile.");
    }
};

export const analyzePayslip = async (file: File): Promise<Payslip> => {
    const imagePart = await fileToGenerativePart(file);

    const prompt = `
Sei un sistema OCR specializzato in buste paga italiane formato "Zucchetti".
Devi compilare lo schema JSON fornito con la MASSIMA precisione possibile.
Non inventare dati: se un campo non è presente, usa 0 per i numeri e stringa vuota per i testi.

────────────────────────────────────
1) STRUTTURA LOGICA DEL DOCUMENTO
────────────────────────────────────
Il cedolino è diviso in 3 zone:

• ZONA 1 – "ELEMENTI DELLA RETRIBUZIONE" (parte alta, box con PAGA BASE, SCATTI, CONTING., E.D.R., IND.FUNZ., TOTALE retribuzione mensile lorda)
  - Regola visiva: ETICHETTA SOPRA → VALORE SOTTO.
  - Esempio: riga con "PAGA BASE", sotto "1.429,19".
  - Queste voci vanno SOLO in "remunerationElements".
  - NON vanno sommate di nuovo nelle competenze del mese.

• ZONA 2 – TABELLA "VOCI VARIABILI DEL MESE" (corpo centrale)
  - Colonne essenziali da sinistra a destra:
    [Codice/Descrizione] … [colonne centrali: base, ore, riferimenti] … [TRATTENUTE] [COMPETENZE]
  - Devi leggere riga per riga in ORIZZONTALE.
  - IGNORA SEMPRE le colonne centrali (base, imponibile, residuo, ore, giorni, aliquote).
  - Usa SOLO le ultime due colonne a destra:
    • penultima: importi di TRATTENUTE (a carico del dipendente)
    • ultima: importi di COMPETENZE (a favore del dipendente)

• ZONA 3 – RIEPILOGHI FINALI (parti basse: TOTALE COMPETENZE, TOTALE TRATTENUTE, NETTO DEL MESE, Dati Fiscali, TFR, Ferie/Permessi)
  - Qui leggi i totali esposti e le tabelle riepilogative.
  - "TOTALE COMPETENZE", "TOTALE TRATTENUTE", "NETTO DEL MESE" sono i valori di riferimento principali.

────────────────────────────────────
2) REMUNERATIONELEMENTS (VOCI FISSE)
────────────────────────────────────
• Individua la sezione "ELEMENTI DELLA RETRIBUZIONE" o simile.
• Inserisci in "remunerationElements" una voce per ciascun elemento fisso:
  - descrizione: es. "Paga Base", "Scatti", "Contingenza", "E.D.R.", "Indennità di funzione".
  - value: valore letto SOTTO l'etichetta.
• NON inserire queste voci in "incomeItems". Rimangono SOLO come composizione della retribuzione teorica.

────────────────────────────────────
3) INCOMEITEMS E DEDUCTIONITEMS (SOLO IMPORTI DEL MESE)
────────────────────────────────────
Lavora sulla tabella "VOCI VARIABILI DEL MESE" (ZONA 2):

Per OGNI riga della tabella:
  1. Leggi Codice + Descrizione (prima colonna).
  2. Ignora COMPLETAMENTE le colonne centrali (base, ore, impor. fiscale, residuo, ecc.).
  3. Se nella colonna COMPETENZE (ultima a destra) c'è un importo > 0:
     → crea un elemento in "incomeItems" con quella descrizione e quel valore.
  4. Se nella colonna TRATTENUTE (penultima) c'è un importo > 0:
     → crea un elemento in "deductionItems" con quella descrizione e quel valore.

Regole semantiche AGGIUNTIVE (correzioni tipiche Zucchetti):
  • Voci tipicamente COMPETENZE, se hanno importo:
    - "Retribuzione" (Z00001)
    - "Ferie godute" (Z00250)
    - "rimborsi spese no tfr" (006738)
    - "Indennità L.207/24" (F02703) → competenza
  • Voci tipicamente TRATTENUTE, se hanno importo:
    - qualsiasi cosa con "Contributo" (IVS, Ebifarm, ecc.)
    - "FIS D.Lgs.148/2015..."
    - "Ritenute IRPEF"
    - "Addizionale regionale"
    - "Addizionale comunale"
    - "Acconto addiz. comunale"
    - "ACCONTO"
    - "Arrotond. mese pr."

Se l'OCR posiziona erroneamente una di queste voci in COMPETENZE ma dal testo è chiaramente una trattenuta (contiene "Contributo", "Addizionale", "Ritenute", "FIS", "ACCONTO" non di rimborso):
  → considerala come "deductionItem" (trattenuta) e NON come competenza.

────────────────────────────────────
4) GESTIONE SPECIFICA "RIMBORSI DA 730"
────────────────────────────────────
Codice F00880 "Rimborsi da 730":

• Se sulla riga di F00880 vedi SOLO un importo marcato come "Residuo" o chiaramente progressivo (es. "Residuo 327,00") e NON c'è un importo distinto in colonna COMPETENZE/TRATTENUTE:
  → NON creare né incomeItem né deductionItem per F00880 (per il mese l'importo è 0).
• Inserisci eventualmente queste informazioni nel contesto fiscale se servono, ma NON devono alterare i totali del mese.

────────────────────────────────────
5) DATI FISCALI, PREVIDENZIALI, TFR, FERIE E ASSENZE
────────────────────────────────────
• "taxData": leggi i valori SOLO dai riquadri riepilogativi in basso (ZONA 3), NON dalla tabella centrale:
  - Imponibile Fiscale, Imposta Lorda, Detrazioni Lavoro Dipendente, Detrazioni Totali, Imposta Netta, Addizionali.
• "socialSecurityData": usa i box riepilogativi per Imponibile INPS e contributi; se non c'è un quadro dedicato, puoi usare la somma delle voci contributive delle trattenute.
• "tfr" e "leaveData": leggi le apposite tabelle (Imponibile TFR, Quota maturata, Fondo precedente/totale, Ferie/ROL con saldo precedente, maturato, goduto, saldo).
• "sickLeave" (malattia): se presente nella sezione "Assenze" o "Ratei" o tra le voci variabili (es. "Malattia", "Assenza malattia"), estrai il numero di ore/giorni usufruiti nel periodo. Se non presente, ometti completamente questo campo.

────────────────────────────────────
6) COERENZA MATEMATICA
────────────────────────────────────
• Calcola:
  - grossSalary = somma di TUTTI i valori in "incomeItems".
  - totalDeductions = somma di TUTTI i valori in "deductionItems".
  - netSalaryCalcolato = grossSalary - totalDeductions.

• Leggi dalla busta (ZONA 3) se presenti:
  - "TOTALE COMPETENZE"
  - "TOTALE TRATTENUTE"
  - "NETTO DEL MESE"

• Se i totali stampati sono presenti:
  - imposta grossSalary uguale a "TOTALE COMPETENZE".
  - imposta totalDeductions uguale a "TOTALE TRATTENUTE".
  - imposta netSalary uguale a "NETTO DEL MESE".
  Anche se la somma degli item differisce di qualche centesimo, i valori di riferimento sono quelli stampati sul cedolino.

• Se i totali non sono chiaramente leggibili:
  - usa i valori calcolati (grossSalary, totalDeductions, netSalaryCalcolato).

────────────────────────────────────
7) VINCOLI DI OUTPUT
────────────────────────────────────
• Rispondi SOLO con JSON valido che rispetti esattamente lo schema fornito (payslipSchema).
• Usa numeri in formato standard (es. "1.588,45" → 1588.45).
• Se un campo richiesto non è presente sul documento, usa:
  - 0 per i numeri,
  - "" per le stringhe.
• "incomeItems" e "deductionItems" devono contenere SOLO voci che concorrono ai totali di competenze e trattenute del mese, senza elementi fissi duplicati e senza rimborsi 730 "figurativi" (residui).
`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
            { text: prompt },
            imagePart
        ],
        config: {
            responseMimeType: "application/json",
            responseSchema: payslipSchema,
            // massima "rigidità" possibile
            temperature: 0.0,
            topP: 0.1,
            topK: 1
        }
    });

    const jsonStr = response.text.trim();
    try {
        const payslipData = JSON.parse(jsonStr);

        if (!payslipData.id) {
            payslipData.id = `payslip-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        }

        return payslipData as Payslip;
    } catch (e) {
        console.error("Failed to parse Gemini response as JSON:", jsonStr, e);
        throw new Error("L'analisi ha prodotto un risultato non valido. Assicurati che il file sia una busta paga chiara.");
    }
};

export const getComparisonAnalysis = async (payslips: Payslip[]): Promise<string> => {
    const getMonthName = (month: number) => new Date(2000, month - 1, 1).toLocaleString('it-IT', { month: 'long' });

    const payslipsData = payslips.map((p, idx) =>
        `Busta Paga ${idx + 1} (${getMonthName(p.period.month)} ${p.period.year}):\n${JSON.stringify(p, null, 2)}`
    ).join('\n\n');

    const prompt = `In qualità di consulente del lavoro, analizza e confronta le seguenti ${payslips.length} buste paga in formato JSON.

${payslipsData}

Fornisci un'analisi sintetica ma professionale che metta in luce:
1. Le tendenze principali nell'evoluzione dello stipendio e delle voci retributive
2. Le variazioni più significative tra i periodi (es. bonus, straordinari, conguagli fiscali, scatti di anzianità)
3. L'evoluzione delle trattenute fiscali e previdenziali
4. Eventuali anomalie o particolarità degne di nota

Struttura la risposta in modo chiaro e facile da capire per un non addetto ai lavori. Concentrati sull'analisi comparativa complessiva.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text;
};

export const getPayslipSummary = async (payslip: Payslip): Promise<string> => {
    const prompt = `In qualità di consulente del lavoro, crea un'analisi descrittiva chiara e concisa per la seguente busta paga in formato JSON. La descrizione deve essere facilmente comprensibile per un non addetto ai lavori. Struttura la risposta in 2-3 paragrafi.
- **Paragrafo 1:** Inizia con una frase riassuntiva sul risultato netto del mese. Spiega brevemente la relazione tra la retribuzione lorda, le trattenute totali e il netto a pagare.
- **Paragrafo 2:** Evidenzia le voci più significative che hanno composto lo stipendio del mese (es. straordinari, bonus, indennità particolari) e le principali trattenute (contributi previdenziali e imposte IRPEF).
- **Paragrafo 3 (opzionale):** Se ci sono elementi degni di nota come conguagli fiscali, un'alta quota di TFR o variazioni importanti rispetto a uno stipendio "standard", menzionali brevemente.
Mantieni un tono professionale ma accessibile. Non usare formattazione markdown, solo testo semplice. Ecco i dati della busta paga:
${JSON.stringify(payslip, null, 2)}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text;
};


export const getChatResponse = async (
    history: ChatMessage[],
    question: string,
    context: {
        payslips?: Payslip[];
        file?: File;
        focusedPayslip?: Payslip | null;
        payslipsToCompare?: Payslip[] | [Payslip, Payslip] | null;
        includeTaxTables?: boolean;
    }
) => {
    let systemInstruction = `Sei un esperto consulente del lavoro che aiuta le persone a capire tutto ciò che riguarda il mondo del lavoro a 360 gradi. Hai una conoscenza completa su: buste paga, contratti, diritti dei lavoratori, agevolazioni, bonus, maternità, paternità, legge 104, tredicesima, quattordicesima, ferie, permessi, malattia, congedi, contributi, pensioni, TFR, licenziamenti, dimissioni, CCNL e molto altro.

COME DEVI PARLARE:
- Usa un linguaggio semplice e chiaro, accessibile a tutti
- Spiega i concetti complessi in modo comprensibile, senza burocrazia
- Quando spieghi normative o leggi, cita sempre l'anno e il riferimento normativo
- Fornisci informazioni complete e precise, ma sempre in modo accessibile
- Se ci sono scadenze, requisiti specifici o procedure, spiegale chiaramente

ARGOMENTI CHE DEVI SAPER TRATTARE:

**BUSTE PAGA E RETRIBUZIONE:**
- Analisi e spiegazione di tutte le voci della busta paga
- Calcolo lordo, netto, trattenute fiscali e previdenziali
- Elementi della retribuzione: paga base, scatti, indennità, straordinari
- Mensilità aggiuntive: tredicesima, quattordicesima
- Fringe benefit e welfare aziendale

**BONUS E AGEVOLAZIONI:**
- Bonus mamme (esonero contributivo per mamme lavoratrici)
- Bonus nuove nascite e bonus asili nido
- Detrazioni fiscali per lavoro dipendente
- Bonus Renzi / trattamento integrativo
- Indennità L.207/24 (ex Bonus 100 euro)
- Fringe benefit aumentati (soglie 2024-2025)
- Agevolazioni per famiglie numerose

**MATERNITÀ E PATERNITÀ:**
- Congedo di maternità obbligatorio e facoltativo
- Congedo di paternità obbligatorio
- Congedo parentale e indennità
- Permessi per allattamento
- Bonus bebè e assegno unico universale
- Tutele per lavoratrici in gravidanza

**LEGGE 104 E DISABILITÀ:**
- Permessi legge 104/92 (3 giorni al mese)
- Chi ne ha diritto e come richiederli
- Congedo straordinario retribuito (2 anni)
- Tutele sul lavoro per disabili e caregiver
- Agevolazioni fiscali e contributive

**FERIE, PERMESSI E ASSENZE:**
- Maturazione e godimento ferie
- ROL e permessi retribuiti
- Permessi per motivi personali
- Ex festività
- Banca ore
- Assenze per malattia e certificati medici

**CONTRIBUTI E PENSIONE:**
- Contributi INPS (IVS, CUAF, disoccupazione)
- Come leggere la posizione contributiva
- Requisiti per la pensione (anticipata, vecchiaia)
- Totalizzazione e cumulo contributi
- Riscatto laurea e ricongiunzione

**TFR (TRATTAMENTO DI FINE RAPPORTO):**
- Come si calcola il TFR
- Quando viene liquidato
- TFR in busta o al fondo pensione
- Anticipazioni TFR (casa, spese sanitarie)

**CONTRATTI E CCNL:**
- Tipologie di contratto (tempo indeterminato, determinato, apprendistato)
- Differenze tra CCNL (commercio, metalmeccanico, pubblico impiego, ecc.)
- Livelli e inquadramenti
- Periodo di prova
- Clausole contrattuali importanti

**CESSAZIONE DEL RAPPORTO:**
- Dimissioni volontarie
- Licenziamento per giusta causa o giustificato motivo
- Preavviso e mancato preavviso
- NASpI (disoccupazione)
- Procedure di conciliazione

**NORMATIVE E DIRITTI:**
- Orario di lavoro e riposi
- Lavoro straordinario, notturno, festivo
- Sicurezza sul lavoro
- Mobbing e tutele
- Diritto alla disconnessione

COME RISPONDERE:
- Se la domanda riguarda la busta paga dell'utente, usa i dati che hai a disposizione
- Se la domanda è generale sul mondo del lavoro, fornisci informazioni complete e aggiornate
- Cita sempre le normative quando parli di diritti o obblighi
- Sii preciso con importi, percentuali e scadenze
- Se qualcosa è cambiato recentemente, specificalo
- Se non sei sicuro di un'informazione o è troppo specifica, consiglia di verificare con un consulente o con l'INPS

COSA NON DEVI MAI FARE:
- Non inventare dati o cifre se non le hai
- Non dare consigli fiscali specifici senza avvisare di verificare con un commercialista
- Non usare termini tecnici senza spiegarli
- Non dare risposte vaghe: sii sempre specifico e utile

ALLA FINE:
Chiudi sempre chiedendo se l'utente vuole approfondire qualcosa o ha altre domande sul mondo del lavoro.

Se non hai un dato specifico nella busta paga, dillo chiaramente e spiega dove può trovarlo o come può calcolarlo.`;

    if (context.payslipsToCompare && context.payslipsToCompare.length > 0) {
        const getMonthName = (month: number) => new Date(2000, month - 1, 1).toLocaleString('it-IT', { month: 'long' });
        const payslipsText = context.payslipsToCompare.map((p, idx) =>
            `Busta Paga ${idx + 1} (${getMonthName(p.period.month)} ${p.period.year}):\n${JSON.stringify(p, null, 2)}`
        ).join('\n\n');
        systemInstruction += `\nL'utente sta confrontando ${context.payslipsToCompare.length} buste paga. Basa le tue risposte su di esse, usandole come contesto primario:\n\n${payslipsText}`;
    } else if (context.focusedPayslip) {
        systemInstruction += `\nL'utente sta visualizzando questa busta paga. Basa le tue risposte principalmente su di essa, usandola come contesto primario:\n${JSON.stringify(context.focusedPayslip, null, 2)}`;
    } else if (context.payslips && context.payslips.length > 0) {
        systemInstruction += `\nEcco i dati delle buste paga dell'utente che hai a disposizione come archivio:\n${JSON.stringify(context.payslips, null, 2)}`;
    }

    if (context.file) {
        systemInstruction += `\nL'utente ha anche allegato un documento. Usalo come contesto primario se la domanda sembra riferirsi ad esso.`;
    }

    if (context.includeTaxTables) {
        systemInstruction += `\nL'utente ha richiesto di usare come riferimento il seguente documento con le tabelle delle addizionali comunali. Usalo come contesto per rispondere a domande relative a questo argomento.\n\n--- INIZIO DOCUMENTO ADDIZIONALI COMUNALI ---\n${MUNICIPAL_TAX_TABLES_TEXT}\n--- FINE DOCUMENTO ADDIZIONALI COMUNALI ---`;
    }

    const conversationHistory = history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));

    const userParts: any[] = [{ text: question }];
    if (context.file) {
        const filePart = await fileToGenerativePart(context.file);
        userParts.unshift(filePart);
    }
    
    const contents = [...conversationHistory, { role: 'user', parts: userParts }];

    const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
            systemInstruction: systemInstruction,
        }
    });

    return responseStream;
};

const historicalAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "Una breve sintesi (2-3 frasi) delle variazioni principali osservate nello storico." },
        monthlyData: {
            type: Type.ARRAY,
            description: "Dati riassuntivi per ogni mese, ordinati cronologicamente dal più vecchio al più recente.",
            items: {
                type: Type.OBJECT,
                properties: {
                    month: { type: Type.NUMBER, description: "Mese (1-12)" },
                    year: { type: Type.NUMBER, description: "Anno (es. 2024)" },
                    netSalary: { type: Type.NUMBER, description: "Stipendio netto del mese" },
                    grossSalary: { type: Type.NUMBER, description: "Stipendio lordo del mese" },
                    totalDeductions: { type: Type.NUMBER, description: "Totale trattenute del mese" },
                    items: {
                        type: Type.ARRAY,
                        description: "Voci significative del mese (straordinari, bonus, contributi, etc.)",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                description: { type: Type.STRING, description: "Nome della voce" },
                                value: { type: Type.NUMBER, description: "Valore della voce" },
                                type: { type: Type.STRING, description: "'income', 'deduction', o 'other'" }
                            },
                            required: ['description', 'value', 'type']
                        }
                    }
                },
                required: ['month', 'year', 'netSalary', 'grossSalary', 'totalDeductions', 'items']
            }
        },
        comparisons: {
            type: Type.ARRAY,
            description: "Tabella comparativa delle voci principali mese per mese con differenze.",
            items: {
                type: Type.OBJECT,
                properties: {
                    description: { type: Type.STRING, description: "Nome della voce (es. 'Stipendio Netto', 'Straordinari', 'Contributi INPS')" },
                    type: { type: Type.STRING, description: "'income', 'deduction', 'other', o 'summary' per le voci riassuntive" },
                    values: {
                        type: Type.ARRAY,
                        description: "Valori per ogni mese in ordine cronologico",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                month: { type: Type.NUMBER, description: "Mese" },
                                year: { type: Type.NUMBER, description: "Anno" },
                                value: { type: Type.NUMBER, description: "Valore della voce nel mese" },
                                differenceFromPrevious: { type: Type.NUMBER, nullable: true, description: "Differenza rispetto al mese precedente (null per il primo mese)" }
                            },
                            required: ['month', 'year', 'value', 'differenceFromPrevious']
                        }
                    }
                },
                required: ['description', 'type', 'values']
            }
        },
        insights: {
            type: Type.ARRAY,
            description: "Osservazioni chiave sulle variazioni più significative.",
            items: {
                type: Type.OBJECT,
                properties: {
                    category: { type: Type.STRING, description: "Categoria dell'osservazione (es. 'Straordinari', 'Tasse', 'Contributi')" },
                    observation: { type: Type.STRING, description: "Breve osservazione sulla variazione" }
                },
                required: ['category', 'observation']
            }
        }
    },
    required: ['summary', 'monthlyData', 'comparisons', 'insights']
};


export const getHistoricalAnalysis = async (currentPayslip: Payslip, historicalPayslips: Payslip[]): Promise<HistoricalAnalysisResult> => {
    if (historicalPayslips.length === 0) {
        throw new Error("Nessuna busta paga storica fornita per l'analisi.");
    }
    
    const allPayslips = [...historicalPayslips, currentPayslip].sort((a, b) => {
        if (a.period.year !== b.period.year) return a.period.year - b.period.year;
        return a.period.month - b.period.month;
    });
    
    const prompt = `In qualità di esperto consulente del lavoro, crea un'analisi comparativa MESE PER MESE delle buste paga fornite. L'obiettivo è mostrare l'evoluzione nel tempo di ogni voce.

**Buste Paga (in ordine cronologico):**
${JSON.stringify(allPayslips, null, 2)}

**Istruzioni:**
1. **Ordina cronologicamente:** I dati devono essere ordinati dal mese più vecchio al più recente.

2. **monthlyData:** Per ogni mese, estrai:
   - Stipendio netto e lordo
   - Totale trattenute
   - Voci significative (straordinari, bonus, indennità, contributi importanti)

3. **comparisons:** Crea una tabella comparativa con queste voci OBBLIGATORIE:
   - "Stipendio Netto" (type: summary)
   - "Stipendio Lordo" (type: summary)
   - "Totale Trattenute" (type: summary)
   - Altre voci rilevanti che variano tra i mesi (straordinari, bonus, contributi INPS, IRPEF, etc.)
   
   Per ogni voce, includi il valore di OGNI mese e calcola la differenza rispetto al mese precedente.
   La differenza del primo mese è null.

4. **insights:** Fornisci 3-5 osservazioni brevi sulle variazioni più significative (es. "Straordinari aumentati del 50% a Marzo", "IRPEF stabile nei 6 mesi").

5. **summary:** Una sintesi di 2-3 frasi sull'andamento generale.

**IMPORTANTE:** 
- Ogni voce in "comparisons" DEVE avere un valore per OGNI mese presente nei dati.
- Se una voce non è presente in un mese, usa 0 come valore.
- Calcola sempre differenceFromPrevious come (valore_corrente - valore_precedente).
- Rispetta rigorosamente lo schema JSON.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: historicalAnalysisSchema
        }
    });

    const jsonStr = response.text.trim();
    try {
        const analysisData = JSON.parse(jsonStr);
        return analysisData as HistoricalAnalysisResult;
    } catch (e) {
        console.error("Failed to parse Gemini historical analysis response as JSON:", jsonStr, e);
        throw new Error("L'analisi storica ha prodotto un risultato non valido.");
    }
};