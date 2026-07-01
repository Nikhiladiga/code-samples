package org.typesense.samplekotlin.presentation

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.widget.addTextChangedListener
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.LinearLayoutManager
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.typesense.api.Client
import org.typesense.api.Configuration
import org.typesense.resources.Node
import org.typesense.samplekotlin.data.repository.TypesenseBookRepository
import org.typesense.samplekotlin.databinding.ActivityMainBinding
import org.typesense.samplekotlin.domain.usecase.SearchBooksUseCase
import java.time.Duration

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var viewModel: BookViewModel
    private var searchJob: Job? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupViewModel()
        setupRecyclerView()
        setupSearch()
        observeUiState()
        
        // Initial search to show all books
        viewModel.search("*") 
    }

    private fun setupViewModel() {
        // Local Typesense configuration
        // 10.0.2.2 is the special IP address to access the host machine from the Android emulator.
        // If you are using a physical device, use your machine's local IP (e.g., 192.168.1.x).
        val nodes = listOf(Node("http", "10.0.2.2", "8108"))
        val configuration = Configuration(nodes, Duration.ofSeconds(2), "xyz") 
        val client = Client(configuration)
        
        val repository = TypesenseBookRepository(client)
        val useCase = SearchBooksUseCase(repository)
        
        viewModel = ViewModelProvider(this, object : ViewModelProvider.Factory {
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                @Suppress("UNCHECKED_CAST")
                return BookViewModel(useCase) as T
            }
        })[BookViewModel::class.java]
    }

    private fun setupRecyclerView() {
        val adapter = BookAdapter()
        binding.recyclerView.layoutManager = GridLayoutManager(this, 2)
        binding.recyclerView.adapter = adapter
    }

    private fun setupSearch() {
        binding.searchEditText.addTextChangedListener { text ->
            searchJob?.cancel()
            searchJob = lifecycleScope.launch {
                delay(300) // Debounce search
                viewModel.search(text?.toString() ?: " ")
            }
        }
    }

    private fun observeUiState() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect { state ->
                    when (state) {
                        is BookUiState.Idle -> {
                            binding.progressBar.visibility = View.GONE
                        }
                        is BookUiState.Loading -> {
                            binding.progressBar.visibility = View.VISIBLE
                        }
                        is BookUiState.Success -> {
                            binding.progressBar.visibility = View.GONE
                            (binding.recyclerView.adapter as BookAdapter).submitList(state.books)
                        }
                        is BookUiState.Error -> {
                            binding.progressBar.visibility = View.GONE
                            Toast.makeText(this@MainActivity, state.message, Toast.LENGTH_SHORT).show()
                        }
                    }
                }
            }
        }
    }
}
