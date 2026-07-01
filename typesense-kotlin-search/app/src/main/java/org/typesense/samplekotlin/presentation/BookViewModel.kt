package org.typesense.samplekotlin.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import org.typesense.samplekotlin.domain.model.Book
import org.typesense.samplekotlin.domain.usecase.SearchBooksUseCase

class BookViewModel(private val searchBooksUseCase: SearchBooksUseCase) : ViewModel() {

    private val _uiState = MutableStateFlow<BookUiState>(BookUiState.Idle)
    val uiState: StateFlow<BookUiState> = _uiState

    fun search(query: String) {
        if (query.isBlank()) {
            _uiState.value = BookUiState.Idle
            return
        }

        _uiState.value = BookUiState.Loading
        viewModelScope.launch {
            searchBooksUseCase(query)
                .onSuccess { books ->
                    _uiState.value = BookUiState.Success(books)
                }
                .onFailure { error ->
                    _uiState.value = BookUiState.Error(error.message ?: "Unknown error")
                }
        }
    }
}

sealed class BookUiState {
    object Idle : BookUiState()
    object Loading : BookUiState()
    data class Success(val books: List<Book>) : BookUiState()
    data class Error(val message: String) : BookUiState()
}
