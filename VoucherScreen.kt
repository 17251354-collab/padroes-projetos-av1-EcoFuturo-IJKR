package com.ecofuturo.esuda.screens

import com.ecofuturo.esuda.R
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.navigation.NavController
import com.ecofuturo.esuda.components.BottomBar
import com.ecofuturo.esuda.components.MenuDrawer
import com.ecofuturo.esuda.data.UsuarioLogado
import com.ecofuturo.esuda.ui.theme.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

enum class StatusVoucher {
    RESERVADO, RESGATADO, USADO, EXPIRADO
}

data class Voucher(
    val id: String = UUID.randomUUID().toString(),
    val nome: String,
    val emoji: String = "🎁",
    val custoMoedas: Double,
    val dataReserva: Long,
    val dataValidade: Long,
    val dataUso: Long? = null,
    val status: StatusVoucher,
    val qrCode: String = "ECO${UUID.randomUUID().toString().take(8).uppercase()}"
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VoucherScreen(navController: NavController) {
    val usuario = UsuarioLogado.getUsuario()
    val drawerState = rememberDrawerState(DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    var saldoTotal by remember { mutableStateOf(usuario.moedas.toDouble()) }
    var abaSelecionada by remember { mutableStateOf(0) }
    var voucherSelecionado by remember { mutableStateOf<Voucher?>(null) }
    var showQRDialog by remember { mutableStateOf(false) }

    var listaVouchers by remember { mutableStateOf<List<Voucher>>(emptyList()) }

    val dateFormat = remember {
        SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
    }

    fun isExpirado(voucher: Voucher): Boolean {
        return System.currentTimeMillis() > voucher.dataValidade && voucher.status == StatusVoucher.RESERVADO
    }

    val vouchersAtivos = listaVouchers.filter {
        it.status != StatusVoucher.USADO && !isExpirado(it)
    }
    val vouchersHistorico = listaVouchers.filter {
        it.status == StatusVoucher.USADO
    }

    // MODAL QRCODE COM A IMAGEM
    if (showQRDialog && voucherSelecionado != null) {
        Dialog(onDismissRequest = { showQRDialog = false }) {
            Column(
                modifier = Modifier
                    .clip(RoundedCornerShape(20.dp))
                    .background(Color(0xFF1E2A3A))
                    .border(1.dp, VerdeNeon.copy(alpha = 0.3f), RoundedCornerShape(20.dp))
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("✅", fontSize = 24.sp)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        "Voucher Utilizado!",
                        color = Branco,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    "Apresente este código:",
                    color = Cinza,
                    fontSize = 14.sp
                )

                Spacer(modifier = Modifier.height(16.dp))

                Box(
                    modifier = Modifier
                        .size(200.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Branco)
                        .padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    // IMAGEM DO QR CODE
                    Image(
                        painter = painterResource(id = R.drawable.qr_placeholder),
                        contentDescription = "QR Code",
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Fit
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    voucherSelecionado!!.qrCode,
                    color = Cinza,
                    fontSize = 12.sp
                )

                Spacer(modifier = Modifier.height(20.dp))

                Button(
                    onClick = { showQRDialog = false },
                    colors = ButtonDefaults.buttonColors(containerColor = VerdeNeon),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.width(120.dp)
                ) {
                    Text("Fechar", color = Preto, fontWeight = FontWeight.Bold)
                }
            }
        }
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            MenuDrawer(
                navController = navController,
                tipoUsuario = usuario.tipo,
                rotaAtual = "resgates",
                onClose = { scope.launch { drawerState.close() } },
                onLogout = { navController.navigate("login") { popUpTo(0) { inclusive = true } } }
            )
        }
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("🌱", fontSize = 20.sp)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                "ECOFUTURO ESUDA",
                                color = VerdeNeon,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                        }
                    },
                    navigationIcon = {
                        IconButton(onClick = { scope.launch { drawerState.open() } }) {
                            Icon(Icons.Filled.Menu, "Menu", tint = Branco)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Preto)
                )
            },
            bottomBar = { BottomBar(navController = navController, rotaAtual = "resgates") },
            containerColor = Preto
        ) { padding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .background(Preto)
            ) {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    item {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .border(1.dp, VerdeNeon.copy(alpha = 0.3f), RoundedCornerShape(16.dp))
                                .background(FundoCard)
                                .padding(20.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("🎟️", fontSize = 24.sp)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    "Meus Vouchers",
                                    color = Branco,
                                    fontSize = 24.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            Spacer(modifier = Modifier.height(16.dp))
                            Divider(color = VerdeNeon.copy(alpha = 0.3f))
                            Spacer(modifier = Modifier.height(16.dp))

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (abaSelecionada == 0) VerdeNeon.copy(alpha = 0.1f) else Color.Transparent)
                                    .clickable { abaSelecionada = 0 }
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("📌", fontSize = 20.sp)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    "Vouchers Ativos",
                                    color = if (abaSelecionada == 0) VerdeNeon else Branco,
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }

                            Spacer(modifier = Modifier.height(12.dp))
                            Divider(color = VerdeNeon.copy(alpha = 0.3f))
                            Spacer(modifier = Modifier.height(12.dp))

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (abaSelecionada == 1) VerdeNeon.copy(alpha = 0.1f) else Color.Transparent)
                                    .clickable { abaSelecionada = 1 }
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("📜", fontSize = 20.sp)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    "Histórico",
                                    color = if (abaSelecionada == 1) VerdeNeon else Branco,
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }

                    if (abaSelecionada == 0) {
                        if (vouchersAtivos.isEmpty()) {
                            item {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 40.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text("🎁", fontSize = 48.sp)
                                    Spacer(Modifier.height(16.dp))
                                    Text(
                                        "Nenhum voucher reservado",
                                        color = Cinza,
                                        fontSize = 16.sp,
                                        textAlign = TextAlign.Center
                                    )
                                    Spacer(Modifier.height(8.dp))
                                    Text(
                                        "Vá ao Catálogo e escolha um benefício",
                                        color = Cinza.copy(alpha = 0.7f),
                                        fontSize = 14.sp,
                                        textAlign = TextAlign.Center
                                    )
                                }
                            }
                        } else {
                            items(vouchersAtivos) { voucher ->
                                VoucherAtivoCard(
                                    voucher = voucher,
                                    saldoAtual = saldoTotal,
                                    dateFormat = dateFormat,
                                    onResgatar = {
                                        if (saldoTotal >= voucher.custoMoedas) {
                                            saldoTotal -= voucher.custoMoedas
                                            listaVouchers = listaVouchers.map {
                                                if (it.id == voucher.id) it.copy(status = StatusVoucher.RESGATADO) else it
                                            }
                                        }
                                    },
                                    onUsar = {
                                        voucherSelecionado = voucher
                                        listaVouchers = listaVouchers.map {
                                            if (it.id == voucher.id) it.copy(
                                                status = StatusVoucher.USADO,
                                                dataUso = System.currentTimeMillis()
                                            ) else it
                                        }
                                        showQRDialog = true
                                    },
                                    onExcluir = {
                                        if (voucher.status == StatusVoucher.RESGATADO) {
                                            saldoTotal += voucher.custoMoedas
                                        }
                                        listaVouchers = listaVouchers.filter { it.id != voucher.id }
                                    }
                                )
                            }
                        }
                    } else {
                        if (vouchersHistorico.isEmpty()) {
                            item {
                                Text(
                                    "Nenhum voucher usado ainda",
                                    color = Cinza,
                                    modifier = Modifier.fillMaxWidth(),
                                    textAlign = TextAlign.Center
                                )
                            }
                        } else {
                            items(vouchersHistorico) { voucher ->
                                VoucherHistoricoCard(voucher = voucher, dateFormat = dateFormat)
                            }
                        }
                    }

                    item {
                        Text(
                            "EcoFuturo ESUDA © 2026 Todos os direitos reservados",
                            color = Cinza,
                            fontSize = 10.sp,
                            textAlign = TextAlign.Center,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 16.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun VoucherAtivoCard(
    voucher: Voucher,
    saldoAtual: Double,
    dateFormat: SimpleDateFormat,
    onResgatar: () -> Unit,
    onUsar: () -> Unit,
    onExcluir: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .border(1.dp, VerdeNeon.copy(alpha = 0.2f), RoundedCornerShape(16.dp))
            .background(FundoCard.copy(alpha = 0.6f))
            .padding(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(voucher.emoji, fontSize = 20.sp)
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                voucher.nome,
                color = Branco,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("📅", fontSize = 14.sp)
            Spacer(modifier = Modifier.width(4.dp))
            Text(dateFormat.format(Date(voucher.dataReserva)), color = Branco, fontSize = 14.sp)
        }

        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("⏰", fontSize = 14.sp)
            Spacer(modifier = Modifier.width(4.dp))
            Text("Expira: ${dateFormat.format(Date(voucher.dataValidade))}", color = Cinza, fontSize = 14.sp)
        }

        Spacer(modifier = Modifier.height(8.dp))

        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(20.dp))
                .background(Color(0xFF5A4A00))
                .padding(horizontal = 12.dp, vertical = 4.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("📌", fontSize = 12.sp)
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    if (voucher.status == StatusVoucher.RESERVADO) "Reservado" else "Resgatado",
                    color = Color(0xFFFFD700),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = {
                    if (voucher.status == StatusVoucher.RESERVADO) {
                        onResgatar()
                    } else {
                        onUsar()
                    }
                },
                enabled = if (voucher.status == StatusVoucher.RESERVADO) saldoAtual >= voucher.custoMoedas else true,
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFF2196F3),
                    disabledContainerColor = Cinza
                ),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text(
                    if (voucher.status == StatusVoucher.RESERVADO) "✅ Resgatar" else "✅ Usar",
                    color = Branco,
                    fontWeight = FontWeight.Bold
                )
            }

            IconButton(
                onClick = onExcluir,
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFFE53935))
            ) {
                Text("🗑️", fontSize = 20.sp)
            }
        }
    }
}

@Composable
fun VoucherHistoricoCard(voucher: Voucher, dateFormat: SimpleDateFormat) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .border(1.dp, VerdeNeon.copy(alpha = 0.2f), RoundedCornerShape(16.dp))
            .background(FundoCard.copy(alpha = 0.6f))
            .padding(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(voucher.emoji, fontSize = 20.sp)
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                voucher.nome,
                color = Branco,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("✅", fontSize = 14.sp)
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                "Usado em: ${voucher.dataUso?.let { dateFormat.format(Date(it)) } ?: "-"}",
                color = VerdeNeon,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold
            )
        }

        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("💰", fontSize = 14.sp)
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                "Custo: ${String.format("%.0f", voucher.custoMoedas)} moedas",
                color = Cinza,
                fontSize = 14.sp
            )
        }
    }
}